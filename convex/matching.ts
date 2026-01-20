"use node";

import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ... (embedding generation remains same)

export const generateEmbedding = internalAction({
    args: { text: v.string() },
    handler: async (_, args): Promise<number[]> => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY not set. Matching will be degraded.");
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

        // Generate Embedding and Verification Questions (concurrently)
        const embeddingPromise = ctx.runAction(internal.matching.generateEmbedding, {
            text: textToEmbed,
        });

        const questionsPromise = listing.type === "found" ?
            ctx.runAction(internal.verificationActions.generateQuestionsForListing, {
                listingId: args.listingId,
            }).catch(e => console.error("Question gen failed", e)) : // graceful failure
            Promise.resolve(); // no-op for lost items

        const [embedding] = await Promise.all([embeddingPromise, questionsPromise]);

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
            // Final Score: Simple Average
            const hybridScore = (vectorScore + ruleScore) / 2;

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
    const maxScore = 100; // Normalized to 100 for percentages

    // 1. Category Match (30%)
    const categoryOverlap = source.categories.some((c: string) => target.categories.includes(c));
    if (categoryOverlap) {
        score += 30;
    } else {
        return 0; // Distinct categories likely don't match
    }

    // 2. Location Match (25%)
    if (source.latitude && source.longitude && target.latitude && target.longitude) {
        const distance = getDistanceFromLatLonInKm(
            source.latitude,
            source.longitude,
            target.latitude,
            target.longitude
        );
        if (distance <= 5) { // Within 5km
            score += 25;
        } else if (distance <= 20) { // Within 20km partial credit
            score += 10;
        }
    }

    // 3. Title/Text Fuzzy Match (15%)
    const sourceTitle = source.title.toLowerCase();
    const targetTitle = target.title.toLowerCase();
    if (sourceTitle.includes(targetTitle) || targetTitle.includes(sourceTitle)) {
        score += 15;
    } else {
        const sourceWords = sourceTitle.split(" ");
        const targetWords = targetTitle.split(" ");
        const intersection = sourceWords.filter((w: string) => targetWords.includes(w));
        if (intersection.length > 0) score += Math.min(15, 5 * intersection.length);
    }

    // 4. Brand Match (10%)
    if (source.brand && target.brand) {
        if (source.brand.toLowerCase() === target.brand.toLowerCase()) {
            score += 10;
        }
    }

    // 5. Color Match (10%)
    if (source.color && target.color) {
        if (source.color.toLowerCase() === target.color.toLowerCase()) {
            score += 10;
        }
    }

    // 6. Date Proximity (10%)
    const timeDiff = Math.abs(source.createdAt - target.createdAt);
    const dayDiff = timeDiff / (1000 * 60 * 60 * 24);
    if (dayDiff <= 7) { // Within 7 days
        score += 10;
    } else if (dayDiff <= 30) {
        score += 5;
    }

    return score / maxScore;
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}
