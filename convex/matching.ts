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
    latitude?: number;
    longitude?: number;
}

function calculateRuleScore(
    source: ListingForScoring,
    target: ListingForScoring
): number {
    let score = 0;
    const maxScore = 100;

    // Category overlap (40 points max)
    const categoryOverlap = source.categories.filter((c) =>
        target.categories.includes(c)
    ).length;
    const categoryScore = Math.min(categoryOverlap * 20, 40);
    score += categoryScore;

    // Location proximity (30 points max)
    if (
        source.latitude &&
        source.longitude &&
        target.latitude &&
        target.longitude
    ) {
        const distance = calculateDistance(
            source.latitude,
            source.longitude,
            target.latitude,
            target.longitude
        );
        // Full points if within 1km, decreasing to 0 at 10km
        if (distance <= 1) {
            score += 30;
        } else if (distance <= 10) {
            score += Math.round(30 * (1 - (distance - 1) / 9));
        }
    }

    // Color match (15 points)
    if (
        source.color &&
        target.color &&
        source.color.toLowerCase() === target.color.toLowerCase()
    ) {
        score += 15;
    }

    // Brand match (15 points)
    if (
        source.brand &&
        target.brand &&
        source.brand.toLowerCase() === target.brand.toLowerCase()
    ) {
        score += 15;
    }

    return score / maxScore; // Normalize to 0-1
}

// Haversine distance formula (returns km)
function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
