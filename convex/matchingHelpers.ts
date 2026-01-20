import { query, mutation, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";


// ============================================
// INTERNAL QUERIES (used by actions)
// ============================================

export const getListingInternal = internalQuery({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.listingId);
    },
});

export const vectorSearchListings = internalQuery({
    args: {
        embedding: v.array(v.float64()),
        oppositeType: v.union(v.literal("lost"), v.literal("found")),
        limit: v.number(),
    },
    handler: async (ctx, args) => {
        // Get all open listings of the opposite type
        const results = await ctx.db
            .query("listings")
            .withIndex("by_type", (q) => q.eq("type", args.oppositeType))
            .filter((q) => q.eq(q.field("status"), "open"))
            .collect();

        // Calculate cosine similarity for each listing with embeddings
        const withScores = results
            .filter((r) => r.embedding && r.embedding.length > 0)
            .map((listing) => ({
                ...listing,
                _score: cosineSimilarity(args.embedding, listing.embedding!),
            }))
            .sort((a, b) => b._score - a._score)
            .slice(0, args.limit);

        return withScores;
    },
});

// Cosine similarity helper
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// ============================================
// INTERNAL MUTATIONS (used by actions)
// ============================================

export const updateListingEmbedding = internalMutation({
    args: {
        listingId: v.id("listings"),
        embedding: v.array(v.float64()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.listingId, {
            embedding: args.embedding,
            updatedAt: Date.now(),
        });
    },
});

export const createMatchInternal = internalMutation({
    args: {
        lostListingId: v.id("listings"),
        foundListingId: v.id("listings"),
        score: v.number(),
    },
    handler: async (ctx, args) => {
        // Check if match already exists
        const existing = await ctx.db
            .query("matches")
            .withIndex("by_lost", (q) => q.eq("lostListingId", args.lostListingId))
            .filter((q) => q.eq(q.field("foundListingId"), args.foundListingId))
            .first();

        if (existing) {
            // Update score if higher
            if (args.score > existing.score) {
                await ctx.db.patch(existing._id, { score: args.score });
            }
            return existing._id;
        }

        return await ctx.db.insert("matches", {
            lostListingId: args.lostListingId,
            foundListingId: args.foundListingId,
            score: args.score,
            status: "suggested",
            createdAt: Date.now(),
        });
    },
});

// ============================================
// PUBLIC QUERIES
// ============================================

export const getMatchesForListing = query({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return []; // Not authenticated

        const listing = await ctx.db.get(args.listingId);
        if (!listing) return [];

        // Verify user owns this listing
        if (listing.clerkUserId !== identity.subject) {
            return []; // User doesn't own this listing
        }

        let matches;
        if (listing.type === "lost") {
            matches = await ctx.db
                .query("matches")
                .withIndex("by_lost", (q) => q.eq("lostListingId", args.listingId))
                .collect();
        } else {
            matches = await ctx.db
                .query("matches")
                .withIndex("by_found", (q) => q.eq("foundListingId", args.listingId))
                .collect();
        }

        // Enrich with listing details
        const enrichedMatches = await Promise.all(
            matches.map(async (match) => {
                const matchedListingId =
                    listing.type === "lost" ? match.foundListingId : match.lostListingId;
                const matchedListing = await ctx.db.get(matchedListingId);

                let imageUrl = null;
                if (matchedListing?.images?.length) {
                    imageUrl = await ctx.storage.getUrl(matchedListing.images[0]);
                }

                return {
                    ...match,
                    matchedListing: matchedListing
                        ? { ...matchedListing, imageUrl }
                        : null,
                };
            })
        );

        return enrichedMatches.sort((a, b) => b.score - a.score);
    },
});

// ============================================
// PUBLIC MUTATIONS
// ============================================

export const confirmMatch = mutation({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        // Verify user owns one of the listings in this match
        const lostListing = await ctx.db.get(match.lostListingId);
        const foundListing = await ctx.db.get(match.foundListingId);

        const ownsLost = lostListing?.clerkUserId === identity.subject;
        const ownsFound = foundListing?.clerkUserId === identity.subject;

        if (!ownsLost && !ownsFound) {
            throw new Error("You do not have permission to confirm this match");
        }

        // Update match status
        await ctx.db.patch(args.matchId, { status: "confirmed" });

        // Update both listings to "matched" status
        await ctx.db.patch(match.lostListingId, {
            status: "matched",
            updatedAt: Date.now(),
        });
        await ctx.db.patch(match.foundListingId, {
            status: "matched",
            updatedAt: Date.now(),
        });

        // Fetch one of the listings to get a title
        const listingItem = await ctx.db.get(match.lostListingId);

        // Schedule email notification
        await ctx.scheduler.runAfter(0, internal.email.sendMatchConfirmation, {
            matchId: args.matchId,
            itemName: listingItem?.title || "Item",
            recipientId: (await ctx.db.get(match.foundListingId))?.clerkUserId || "unknown",
        });

        return { success: true };

    },
});

export const rejectMatch = mutation({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        // Verify user owns one of the listings in this match
        const lostListing = await ctx.db.get(match.lostListingId);
        const foundListing = await ctx.db.get(match.foundListingId);

        const ownsLost = lostListing?.clerkUserId === identity.subject;
        const ownsFound = foundListing?.clerkUserId === identity.subject;

        if (!ownsLost && !ownsFound) {
            throw new Error("You do not have permission to reject this match");
        }

        await ctx.db.patch(args.matchId, { status: "rejected" });
        return { success: true };
    },
});
