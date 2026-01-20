"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateDescription = action({
    args: {
        image: v.string(), // Base64 string
        contentType: v.optional(v.string()), // e.g. "image/jpeg"
    },
    handler: async (ctx, args) => {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("Missing GEMINI_API_KEY");
        }

        const { image, contentType = "image/jpeg" } = args;

        // Clean base64 string if it contains metadata prefix
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const prompt = `
      Analyze this image of a lost/found item. 
      Generate a detailed, objective listing description.
      
      Output strictly in JSON format with the following fields:
      - title: A short, clear title (e.g. "Black Leather Wallet", "iPhone 13 Pro").
      - description: A detailed description of physical appearance, distinctive features, scratches, stickers, brands, etc. Keep it professional.
      - category: One of ["wallet", "phone", "keys", "bag", "documents", "electronics", "jewelry", "clothing", "id_card", "cash", "other"].
      - color: Dominant color (e.g. "Black", "Red").
      - brand: Visible brand name or "Unknown".
      
      Do not include markdown formatting like \`\`\`json. Just the raw JSON object.
    `;

        try {
            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: contentType,
                    },
                },
            ]);

            const responseText = result.response.text();

            // Clean potential markdown blocks just in case
            const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

            return JSON.parse(cleanedText);
        } catch (error) {
            console.error("AI Description Generation Error:", error);
            throw new Error("Failed to generate description from image.");
        }
    },
});
