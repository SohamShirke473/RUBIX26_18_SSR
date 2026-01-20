"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

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
      - category: One of ["wallet", "phone", "keys", "bag", "documents", "electronics", "jewelry", "clothing", "watch", "glasses", "laptop", "tablet", "headphones", "camera", "musical_instrument", "sports_gear", "tools", "pet", "tickets", "id_card", "cash", "other"].
      - color: Dominant color (e.g. "Black", "Red").
      - brand: Visible brand name or "Unknown".
      Do not include markdown formatting like \`\`\`json. Just the raw JSON object.
      keep it under 300 words.
    `;

        const maxRetries = 3;
        let attempt = 0;

        while (attempt < maxRetries) {
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
            } catch (error: any) {
                console.error(`AI Attempt ${attempt + 1} failed:`, error);

                // key checks for retryable errors (503 Service Unavailable, or generic overloaded messages)
                const isRetryable = error.message?.includes("503") || error.status === 503 || error.message?.includes("overloaded");

                if (isRetryable && attempt < maxRetries - 1) {
                    const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
                    console.log(`Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    attempt++;
                    continue;
                }

                // If not retryable or max retries reached, throw refined error
                throw new Error("Failed to generate description from image. Service may be busy, please try again.");
            }
        }
    },
});
