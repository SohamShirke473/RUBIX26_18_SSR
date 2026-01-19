"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ============================================
// EMBEDDING GENERATION (Gemini Free Tier)
// ============================================

export const generateEmbedding = internalAction({
    args: { text: v.string() },
    handler: async (_, args): Promise<number[]> => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY environment variable is not set");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

        const result = await model.embedContent(args.text);
        return result.embedding.values;
    },
});

// ============================================
// PROCESS LISTING - Generate embedding & find matches
// ============================================

export const processNewListing = internalAction({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        // Get the listing
        const listing = await ctx.runQuery(internal.matchingHelpers.getListingInternal, {
            listingId: args.listingId,
        });

        if (!listing) {
            throw new Error("Listing not found");
        }

        // Generate embedding for the listing
        const textToEmbed = `${listing.title} ${listing.description} ${listing.categories.join(" ")} ${listing.color || ""} ${listing.brand || ""} ${listing.locationName}`;

        const embedding = await ctx.runAction(internal.matching.generateEmbedding, {
            text: textToEmbed,
        });

        // Store embedding in the listing
        await ctx.runMutation(internal.matchingHelpers.updateListingEmbedding, {
            listingId: args.listingId,
            embedding,
        });

        // Find and create matches
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
        // Search for opposite type (if lost, search found; if found, search lost)
        const oppositeType = args.listingType === "lost" ? "found" : "lost";

        // Get similar listings using vector search
        const similarListings = await ctx.runQuery(
            internal.matchingHelpers.vectorSearchListings,
            {
                embedding: args.embedding,
                oppositeType,
                limit: 10,
            }
        );

        // Get the source listing for rule-based scoring
        const sourceListing = await ctx.runQuery(
            internal.matchingHelpers.getListingInternal,
            { listingId: args.listingId }
        );

        if (!sourceListing) return;

        // Calculate hybrid scores and create matches
        for (const match of similarListings) {
            if (match._id === args.listingId) continue;

            const ruleScore = calculateRuleScore(sourceListing, match);
            const vectorScore = match._score ?? 0;

            // Hybrid score: 50% vector + 50% rule-based
            const hybridScore = vectorScore * 0.5 + ruleScore * 0.5;

            // Only create match if score is above threshold
            if (hybridScore >= 0.3) {
                const lostId = args.listingType === "lost" ? args.listingId : match._id;
                const foundId = args.listingType === "found" ? args.listingId : match._id;

                await ctx.runMutation(internal.matchingHelpers.createMatchInternal, {
                    lostListingId: lostId,
                    foundListingId: foundId,
                    score: hybridScore,
                });
            }
        }
    },
});

// ============================================
// RULE-BASED SCORING HELPER
// ============================================

interface ListingForScoring {
    categories: string[];
    color?: string;
    brand?: string;
}

function calculateRuleScore(
    source: ListingForScoring,
    target: ListingForScoring
): number {
    let score = 0;
    const maxScore = 100;

    // Category overlap (50 points max) - increased from 40 since location removed
    const categoryOverlap = source.categories.filter((c) =>
        target.categories.includes(c)
    ).length;
    const categoryScore = Math.min(categoryOverlap * 25, 50);
    score += categoryScore;

    // Color match (25 points) - increased from 15
    if (
        source.color &&
        target.color &&
        source.color.toLowerCase() === target.color.toLowerCase()
    ) {
        score += 25;
    }

    // Brand match (25 points) - increased from 15
    if (
        source.brand &&
        target.brand &&
        source.brand.toLowerCase() === target.brand.toLowerCase()
    ) {
        score += 25;
    }

    return score / maxScore; // Normalize to 0-1
}
