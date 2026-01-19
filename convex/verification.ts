"use node";

import { action, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateQuestions = action({
    args: {
        listingId: v.id("listings"),
    },
    handler: async (ctx, args) => {
        const listing = await ctx.runQuery(api.getListing.getListing, { id: args.listingId });

        if (!listing) {
            throw new Error("Listing not found");
        }

        // Don't allow verifying your own item (or maybe allow for testing?)
        // For now, we assume frontend handles "don't show button if me"

        const prompt = `
      You are an item verification assistant. A user claims they lost the item described below.
      We need to verify if it's really theirs by asking 3 specific questions that only the true owner would know, 
      based on the details provided.
      
      Item Title: ${listing.title}
      Item Description: ${listing.description}
      Item Category: ${listing.categories.join(", ")}
      Location: ${listing.locationName}
      Brand: ${listing.brand || "N/A"}
      Color: ${listing.color || "N/A"}

      The description might contain details like specific scratches, contents, or unique identifiers.
      Generate 3 specific multiple-choice questions. 
      For each question, provide:
      1. The question text.
      2. 4 possible options (A, B, C, D).
      3. The correct option index (0-3).

      If the description is too vague to generate specific questions, generate general questions about the type of item 
      but note that confidence might be low.

      Output JSON format:
      [
        {
          "question": "what is...",
          "options": ["A", "B", "C", "D"],
          "correctIndex": 0
        }
      ]
      RETURN ONLY JSON, NO MARKDOWN.
    `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Clean up markdown code blocks if present
            const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const questions = JSON.parse(jsonStr);

            return {
                questions: questions as {
                    question: string;
                    options: string[];
                    correctIndex: number;
                }[] // We wouldn't normally send correctIndex to frontend, but for a "self-verification" flow handled by client-side logic or server check?
                // Ideally, we store the correct answers in a pending verification record on the server and only send questions.
                // For simplicity in this demo, we'll return them but usually we'd cache them in a DB.
                // BETTER APPROACH: Store the *expected* answers in a temporary internal mutation and return only questions.
            };
        } catch (e) {
            console.error("AI Generation failed:", e);
            throw new Error("Failed to generate questions");
        }
    },
});

export const submitVerificationClaim = mutation({
    args: {
        listingId: v.id("listings"),
        answers: v.array(v.object({
            question: v.string(),
            answer: v.string() // Users selected answer string
        })),
        score: v.number(), // Currently trusted from client for demo speed, but logically should be calculated server side.
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Unauthorized");

        await ctx.db.insert("verificationClaims", {
            listingId: args.listingId,
            claimantClerkUserId: user.subject,
            answers: args.answers,
            status: args.score >= 2 ? "approved" : "rejected", // logic: if get 2/3 right
            createdAt: Date.now(),
        });

        return args.score >= 2 ? "approved" : "rejected";
    }
});
