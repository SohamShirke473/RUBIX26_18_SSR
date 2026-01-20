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

RULES (NO EXCEPTIONS):
- Use ONLY facts explicitly written in Item Title or Item Description
- DO NOT infer, assume, or use common knowledge
- DO NOT use category, location, or N/A brand/color
- If a detail is not written, it does not exist

TASK:
Generate 1–3 multiple-choice questions to verify ownership.

FORMAT REQUIREMENTS:
- Output MUST be valid JSON
- Output MUST be either:
  1) A JSON array of questions
  2) OR the vague-description fallback object


QUESTION FORMAT:
[
  {
    "question": "string",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0
  }
]

INPUT:
Item Title: ${listing.title}
Item Description: ${listing.searchText}

REMINDERS:
- Exactly 4 options per question
- Exactly ONE correct answer
- Never guess
- Never enrich descriptions
- Return JSON ONLY
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
