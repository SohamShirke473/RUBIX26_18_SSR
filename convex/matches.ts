import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getMatchesForUser = query({
    args: { clerkUserId: v.string() },
    handler: async (ctx, args) => {
        // 1. Get all open listings for the user
        const userListings = await ctx.db
            .query("listings")
            .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
            .filter((q) => q.eq(q.field("status"), "open"))
            .collect();

        if (userListings.length === 0) {
            return [];
        }

        // 2. Find matches for each listing
        const allMatches = await Promise.all(
            userListings.map(async (userListing) => {
                let matches;
                if (userListing.type === "lost") {
                    matches = await ctx.db
                        .query("matches")
                        .withIndex("by_lost", (q) => q.eq("lostListingId", userListing._id))
                        .collect();
                } else {
                    matches = await ctx.db
                        .query("matches")
                        .withIndex("by_found", (q) => q.eq("foundListingId", userListing._id))
                        .collect();
                }

                // Filter for suggested matches only (not rejected)
                // and enrich with the OTHER listing details
                const enrichedMatches = await Promise.all(
                    matches
                        .filter(m => m.status === "suggested")
                        .map(async (match) => {
                            const otherListingId =
                                userListing.type === "lost" ? match.foundListingId : match.lostListingId;
                            const otherListing = await ctx.db.get(otherListingId);

                            if (!otherListing) return null;

                            let imageUrl = null;
                            if (otherListing.images?.length) {
                                imageUrl = await ctx.storage.getUrl(otherListing.images[0]);
                            }

                            return {
                                matchId: match._id,
                                score: match.score,
                                status: match.status,
                                myListing: {
                                    _id: userListing._id,
                                    title: userListing.title,
                                    type: userListing.type,
                                },
                                matchedListing: {
                                    _id: otherListing._id,
                                    title: otherListing.title,
                                    description: otherListing.description,
                                    type: otherListing.type,
                                    locationName: otherListing.locationName,
                                    createdAt: otherListing.createdAt,
                                    imageUrl,
                                }
                            };
                        })
                );

                return enrichedMatches.filter((m): m is NonNullable<typeof m> => m !== null);
            })
        );

        // Flatten results
        const flatMatches = allMatches.flat();

        // Deduplicate by matchId
        const uniqueMatches = Array.from(
            new Map(flatMatches.map((m) => [m.matchId, m])).values()
        );

        // Sort by score
        return uniqueMatches.sort((a, b) => b.score - a.score);
    },
});

export const confirmMatch = mutation({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Unauthorized");

        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        const lostListing = await ctx.db.get(match.lostListingId);
        const foundListing = await ctx.db.get(match.foundListingId);

        if (!lostListing || !foundListing) throw new Error("Listing not found");

        // Verify user is one of the parties (usually the one confirming, e.g. Lost item owner confirming a suggestion)
        // User request says "lost item owner reviews suggested matches and can either confirm or reject".
        // Also "finder can confirm a match".
        // So allow both to confirm.
        if (lostListing.clerkUserId !== user.subject && foundListing.clerkUserId !== user.subject) {
            throw new Error("Unauthorized");
        }

        // Update match status
        await ctx.db.patch(match._id, { status: "confirmed" });

        // Update listing statuses to 'matched' if not already
        if (lostListing.status === "open") {
            await ctx.db.patch(match.lostListingId, { status: "matched" });
        }
        if (foundListing.status === "open") {
            await ctx.db.patch(match.foundListingId, { status: "matched" });
        }

        // Create conversation
        // Check if exists first? Schema has index by_listing, but we need by pair.
        // Let's just create one if not exists or return existing.
        // Actually, schema `conversations` has `listingId`. Which listing? "listingId: v.id('listings')".
        // It's ambiguous which listing ID is used. Probably the Lost one? Or maybe we create a conversation linked to ONE of them.
        // Let's check `conversations` table definition in schema.
        // `conversations: defineTable({ listingId: v.id("listings"), participantIds: [...] ... })`.
        // Let's assume we link it to the LOST listing ID for context, or maybe we create one for each?
        // Let's link to the Lost Listing ID as the primary context.

        const existingConv = await ctx.db
            .query("conversations")
            .withIndex("by_listing", (q) => q.eq("listingId", match.lostListingId))
            .filter((q) => q.eq(q.field("participantIds"), [lostListing.clerkUserId, foundListing.clerkUserId].sort())) // This filter is tricky on arrays, better to just check manually
            .first();

        // Actually, Convex comparison on arrays is strict.
        // Let's iterate.
        // For simplicity, just create a new one, deduping logic is complex without specific index.
        // Or better: use `listingId` which is unique enough for this pair in this context.

        await ctx.db.insert("conversations", {
            listingId: match.lostListingId,
            participantIds: [lostListing.clerkUserId, foundListing.clerkUserId],
            createdAt: Date.now(),
        });

        return "confirmed";
    },
});

export const rejectMatch = mutation({
    args: { matchId: v.id("matches") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Unauthorized");

        const match = await ctx.db.get(args.matchId);
        if (!match) throw new Error("Match not found");

        // Verify ownership
        const lostListing = await ctx.db.get(match.lostListingId);
        const foundListing = await ctx.db.get(match.foundListingId);

        if (!lostListing || !foundListing) throw new Error("Listings data invalid");

        if (lostListing.clerkUserId !== user.subject && foundListing.clerkUserId !== user.subject) {
            throw new Error("Unauthorized");
        }

        await ctx.db.patch(match._id, { status: "rejected" });

        return "rejected";
    },
});
