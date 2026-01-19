"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ... (embedding generation remains same)

export const generateEmbedding = internalAction({
    args: { text: v.string() },
    handler: async (_, args): Promise<number[]> => {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY/GOOGLE_API_KEY not set. Matching will be degraded.");
            return new Array(768).fill(0); // Return zero vector to prevent crash
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        try {
            const result = await model.embedContent(args.text);
            return result.embedding.values;
        } catch (e) {
            console.error("Embedding failed", e);
            return new Array(768).fill(0);
        }
    },
});

export const processNewListing = internalAction({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        // ... (existing logic)
        const listing = await ctx.runQuery(internal.matchingHelpers.getListingInternal, {
            listingId: args.listingId,
        });

        if (!listing) return;

        // Enhanced Text Representation for Embedding
        // We explicitly label fields to help semantic understanding
        const textToEmbed = `
            Item: ${listing.title}
            Category: ${listing.categories.join(", ")}
            Description: ${listing.description}
            Color: ${listing.color || "Unknown"}
            Brand: ${listing.brand || "Unknown"}
            Location: ${listing.locationName}
        `.trim();

        const embedding = await ctx.runAction(internal.matching.generateEmbedding, {
            text: textToEmbed,
        });

        await ctx.runMutation(internal.matchingHelpers.updateListingEmbedding, {
            listingId: args.listingId,
            embedding,
        });

        await ctx.runAction(internal.matching.findAndCreateMatches, {
            listingId: args.listingId,
            embedding,
            listingType: listing.type,
        });
    },
});

export const findAndCreateMatches = internalAction({
    args: {
        listingId: v.id("listings"),
        embedding: v.array(v.float64()),
        listingType: v.union(v.literal("lost"), v.literal("found")),
    },
    handler: async (ctx, args) => {
        // Search for opposite type
        const oppositeType = args.listingType === "lost" ? "found" : "lost";

        // Get candidates via Vector Search
        // We fetch more candidates to filter/re-rank them
        const candidates = await ctx.runQuery(
            internal.matchingHelpers.vectorSearchListings,
            {
                embedding: args.embedding,
                oppositeType,
                limit: 20, // Increased limit for better re-ranking
            }
        );

        const sourceListing = await ctx.runQuery(
            internal.matchingHelpers.getListingInternal,
            { listingId: args.listingId }
        );

        if (!sourceListing) return;

        for (const candidate of candidates) {
            if (candidate._id === args.listingId) continue;

            // WEIGHTED SCORING SYSTEM
            // 1. Vector Similarity (Base relevance) - 40%
            const vectorScore = candidate._score ?? 0;

            // 2. Keyword/Rule Matching - 60%
            const ruleScore = calculateWeightedRuleScore(sourceListing, candidate);

            // Final Score
            const hybridScore = (vectorScore * 0.4) + (ruleScore * 0.6);

            // Threshold: 0.45 (slightly stricter to avoid bad matches, but rules help good ones pass)
            if (hybridScore >= 0.45) {
                const lostId = args.listingType === "lost" ? args.listingId : candidate._id;
                const foundId = args.listingType === "found" ? args.listingId : candidate._id;

                await ctx.runMutation(internal.matchingHelpers.createMatchInternal, {
                    lostListingId: lostId,
                    foundListingId: foundId,
                    score: hybridScore,
                });
            }
        }
    },
});

// HEURISTIC SCORING
function calculateWeightedRuleScore(source: any, target: any): number {
    let score = 0;
    const maxScore = 150; // Total possible points

    // 1. Category Match (CRITICAL) - 50 points
    // If categories don't overlap, it's very unlikely to be a match.
    const categoryOverlap = source.categories.some((c: string) => target.categories.includes(c));
    if (categoryOverlap) {
        score += 50;
    } else {
        return 0; // Immediate disqualification if categories don't match at all? 
        // Maybe too strict, but for "Lost & Found" usually category is known.
        // Let's keep it as simply 0 points for this section.
    }

    // 2. Title Fuzzy Match (High Relevance) - 40 points
    // Simple inclusion check
    const sourceTitle = source.title.toLowerCase();
    const targetTitle = target.title.toLowerCase();
    if (sourceTitle.includes(targetTitle) || targetTitle.includes(sourceTitle)) {
        score += 40;
    } else {
        // Partial word match check could go here
        const sourceWords = sourceTitle.split(" ");
        const targetWords = targetTitle.split(" ");
        const intersection = sourceWords.filter((w: string) => targetWords.includes(w));
        if (intersection.length > 0) score += 10 * intersection.length; // Up to 40 max
    }

    // 3. Brand Match (Medium Relevance) - 30 points
    if (source.brand && target.brand) {
        if (source.brand.toLowerCase() === target.brand.toLowerCase()) {
            score += 30;
        }
    }

    // 4. Color Match (Medium Relevance) - 30 points
    if (source.color && target.color) {
        if (source.color.toLowerCase() === target.color.toLowerCase()) {
            score += 30;
        }
    }

    // Normalized 0-1
    return Math.min(score, maxScore) / maxScore;
}
