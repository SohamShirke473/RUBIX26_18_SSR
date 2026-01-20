import { query } from "./_generated/server";
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
