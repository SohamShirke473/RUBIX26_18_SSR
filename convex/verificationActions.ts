"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-lite",
    generationConfig: {
        temperature: 0,
        maxOutputTokens: 800,
    },
});

type GeneratedQuestion = {
    question: string;
    options: string[];
    correctIndex: number;
};

export const generateQuestions = action({
    args: {
        claimId: v.id("verificationClaims"),
        listingId: v.id("listings"),
    },
    handler: async (ctx, { claimId, listingId }) => {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("AI configuration error");
        }

        const listing = await ctx.runQuery(api.getListing.getListingById, {
            id: listingId,
        });

        if (!listing) {
            throw new Error("Listing not found");
        }

        const prompt = `
You are a STRICT item-verification question generator.

Your ONLY purpose is to verify whether a claimant truly owns the item.

ABSOLUTE RULES (NO EXCEPTIONS):
1. You may use ONLY information that is EXPLICITLY stated in:
   - Item Title
   - Item Description
2. If a detail is not literally written, it DOES NOT EXIST.
3. You MUST NOT:
   - Infer, assume, or use common knowledge
   - Rephrase vague ideas into specific facts
   - Use item category, location, brand, color, or any field marked "N/A"
4. Every question MUST test a **specific, concrete, verifiable detail** found verbatim in the text.
5. If the description is too vague to form at least ONE clear verification question, you MUST return the fallback object.

QUESTION CONSTRAINTS:
- Generate 1–3 multiple-choice questions ONLY
- Each question must:
  - Be answerable using the given text alone
  - Refer to a single explicit detail (e.g., text written, object mentioned, quantity stated)
- DO NOT ask opinion-based, generic, or speculative questions

ANSWER OPTIONS RULES:
- Exactly 4 options per question
- Exactly ONE correct option
- Incorrect options must be plausible but NOT stated in the text

OUTPUT FORMAT (STRICT):
- Output MUST be valid JSON ONLY
- Output MUST be EITHER:
  1) A JSON array of questions
  2) OR the vague-description fallback object (and nothing else)

QUESTION FORMAT:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0
  }
]

FALLBACK FORMAT (USE ONLY IF NO VERIFIABLE DETAILS EXIST):
{
  "vague": true,
  "reason": "The item description does not contain any concrete, verifiable details that can be used to generate ownership-verification questions."
}

INPUT:
Item Title: ${listing.title}
Item Description: ${listing.searchText}

FINAL CHECK BEFORE RESPONDING:
- If any question could be answered by guessing or common knowledge → DO NOT GENERATE IT
- If you are unsure → RETURN THE FALLBACK

`;

        const result = await model.generateContent(prompt);
        let rawText = result.response.text().trim();

        // Sanitize the output - remove markdown code blocks if present
        if (rawText.startsWith("```")) {
            rawText = rawText.replace(/^```\w*\n?/, "").replace(/```$/, "").trim();
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(rawText);
        } catch {
            console.error("AI returned invalid JSON:", rawText);
            throw new Error("AI returned malformed output");
        }

        // Handle vague-description fallback
        if (
            typeof parsed === "object" &&
            parsed !== null &&
            "note" in parsed
        ) {
            await ctx.runMutation(internal.verification.updateClaimWithQuestions, {
                claimId,
                questions: [],
            });

            return { questions: [] };
        }

        if (!Array.isArray(parsed)) {
            throw new Error("AI output is not an array");
        }

        const questions: GeneratedQuestion[] = parsed;

        // Hard validation
        for (const q of questions) {
            if (
                typeof q.question !== "string" ||
                !Array.isArray(q.options) ||
                q.options.length !== 4 ||
                typeof q.correctIndex !== "number" ||
                q.correctIndex < 0 ||
                q.correctIndex > 3
            ) {
                console.error("Invalid question shape:", q);
                throw new Error("AI output failed validation");
            }
        }

        await ctx.runMutation(internal.verification.updateClaimWithQuestions, {
            claimId,
            questions,
        });

        // Return sanitized questions to client
        return {
            questions: questions.map(({ question, options }) => ({
                question,
                options,
            })),
        };
    },
});
