"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
// Use gemini-1.5-flash for better rate limits and stability on free tier
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const generateQuestions = action({
    args: {
        claimId: v.id("verificationClaims"),
        listingId: v.id("listings"),
    },
    handler: async (ctx, args) => {
        const listing = await ctx.runQuery(api.getListing.getListingById, { id: args.listingId });

        if (!listing) {
            throw new Error("Listing not found");
        }

        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not set in Convex environment variables.");
            throw new Error("AI Configuration Error: Missing API Key");
        }

        const prompt = `
STRICT Item Verification Question Generator Prompt
You are a STRICT item-verification question generator.
A user claims they lost the item described below.
The description below is written by the FINDER of the item.
Your ONLY job is to test whether the claimant truly knows the item.
ABSOLUTE RULES (NO EXCEPTIONS)
You may ONLY use facts that are EXPLICITLY written in:
Item Title
Item Description
You MUST NOT use:
Item Category by itself
Location
Brand if it is "N/A"
Color if it is "N/A"
Common knowledge or assumptions (for example: "keys usually have a keyring")
DO NOT infer, assume, generalize, or add details.
If a detail is not literally present in the text, it DOES NOT EXIST.
Every question MUST map directly to a specific phrase from the description.
Each question must have exactly ONE correct answer.
INPUT
Item Title: ${listing.title}
Item Description: ${listing.description}
STEP 1 — FACT EXTRACTION (INTERNAL, DO NOT OUTPUT)
Extract a list of atomic facts exactly as written.
If a fact is not explicitly stated, do not include it.
This step is internal only and must never appear in the output.
STEP 2 — QUESTION GENERATION
Generate 1 to 3 multiple-choice questions, depending on how many valid facts exist.
Each question must:
Be answerable using ONLY the extracted facts
Test a specific, distinguishing detail
Have exactly four options
Contain exactly ONE correct answer
If only one or two valid facts exist, generate only one or two questions.
Do NOT invent extra questions to reach a fixed count.
VAGUE DESCRIPTION FALLBACK (MANDATORY)
If the description does not contain enough explicit information to generate even one solid fact-based question:
Output ONLY the following JSON object:
{
"note": "This item description is vague. Generating standard verification questions."
}
Then generate 1 to 3 GENERAL questions, but:
Do NOT include invented specifics
Keep questions broad and non-assumptive
OUTPUT FORMAT (STRICT)
Return ONLY a JSON array.
No explanations.
No markdown.
No extra text.
Each question must follow this structure:
[
{
"question": "Question text",
"options": ["Option A", "Option B", "Option C", "Option D"],
"correctIndex": 0
}
]
CRITICAL REMINDERS
Never guess.
Never enrich descriptions.
Never rely on common knowledge.
If it is not written, it does not exist.
`;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // More robust JSON extraction: find the first '[' and last ']'
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                console.error("Could not find JSON array in AI response");
                throw new Error("Invalid AI response format");
            }

            const jsonStr = jsonMatch[0];
            const questions = JSON.parse(jsonStr) as {
                question: string;
                options: string[];
                correctIndex: number;
            }[];

            // Store questions securely in the database
            await ctx.runMutation(internal.verification.updateClaimWithQuestions, {
                claimId: args.claimId,
                questions: questions
            });

            // Return sanitized questions (without correctIndex) to the client can use them if needed immediately
            return {
                questions: questions.map(q => ({
                    question: q.question,
                    options: q.options
                }))
            };
        } catch (e: any) {
            console.error("AI Generation failed:", e);

            // Handle Rate Limiting specifically
            if (e.message?.includes("429") || e.status === 429) {
                throw new Error("AI service is currently busy. Please try again in a minute.");
            }

            throw new Error(e instanceof Error ? e.message : "Failed to generate questions");
        }
    },
});
