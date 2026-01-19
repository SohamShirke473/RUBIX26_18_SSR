import { query } from "./_generated/server";
import { v } from "convex/values";
import { ItemCategory } from "./schema";
import { paginationOptsValidator } from "convex/server";
export const getAllListings = query({
    args: {
        paginationOpts: paginationOptsValidator,
        filterType: v.optional(v.union(v.literal("lost"), v.literal("found"))),
        filterCategory: v.optional(v.array(ItemCategory)),
        search: v.optional(v.string()), // kept for signature compatibility
    },
    handler: async (ctx, args) => {
        // Start with status index for performance
        let q = ctx.db
            .query("listings")
            .withIndex("by_status", q => q.eq("status", "open"));

        // Apply type filter if present
        if (args.filterType) {
            q = q.filter(f => f.eq(f.field("type"), args.filterType));
        }

        // If we have a category filter, we need to fetch all and filter in memory
        // because Convex doesn't support array.includes() in database filters yet
        if (args.filterCategory && args.filterCategory.length > 0) {
            const allListings = await q.collect();

            const filteredListings = allListings.filter(listing => {
                const categories = listing.categories || [];
                return args.filterCategory!.some(cat => categories.includes(cat));
            });

            // Sort by creation time (descending) explicitly since we lost DB order by collecting
            filteredListings.sort((a, b) => b.createdAt - a.createdAt);

            // Manual pagination
            const { cursor, numItems } = args.paginationOpts;
            const startIndex = cursor ? Number(cursor) : 0;
            const endIndex = startIndex + numItems;
            const pageItems = filteredListings.slice(startIndex, endIndex);

            const isDone = endIndex >= filteredListings.length;
            const nextCursor = isDone ? null : String(endIndex);

            // Get image URLs for the page
            const page = await Promise.all(
                pageItems.map(async (listing) => ({
                    ...listing,
                    imageUrl: listing.images?.length
                        ? await ctx.storage.getUrl(listing.images[0])
                        : null,
                }))
            );

            return {
                page,
                isDone,
                continueCursor: nextCursor || "",
                // Split cursor not rigidly supported in manual pagination without more complex logic,
                // but relying on simple index offset for now.
            };
        } else {
            // Standard efficient pagination when no category filter is applied
            const result = await q.order("desc").paginate(args.paginationOpts);

            // Get image URLs for the filtered page
            const page = await Promise.all(
                result.page.map(async (listing) => ({
                    ...listing,
                    imageUrl:
                        listing.images?.length
                            ? await ctx.storage.getUrl(listing.images[0])
                            : null,
                }))
            );

            return { ...result, page };
        }
    },
});

export const searchListings = query({
    args: {
        search: v.string(),
        paginationOpts: paginationOptsValidator,
        filterType: v.optional(v.union(v.literal("lost"), v.literal("found"))),
        filterCategory: v.optional(v.array(ItemCategory)),
    },
    handler: async (ctx, args) => {
        let query = ctx.db.query("listings").withSearchIndex(
            "search_text",
            q => {
                let s = q
                    .search("searchText", args.search)
                    .eq("status", "open");

                if (args.filterType) {
                    s = s.eq("type", args.filterType);
                }

                return s;
            }
        );

        // If category filter is present, we must collect and filter in memory
        if (args.filterCategory && args.filterCategory.length > 0) {
            // Search limits results naturally, so collecting is usually safe
            const allResults = await query.collect();

            const filteredResults = allResults.filter(listing => {
                const categories = listing.categories || [];
                return args.filterCategory!.some(cat => categories.includes(cat));
            });

            // Manual pagination
            const { cursor, numItems } = args.paginationOpts;
            const startIndex = cursor ? Number(cursor) : 0;
            const endIndex = startIndex + numItems;
            const pageItems = filteredResults.slice(startIndex, endIndex);

            const isDone = endIndex >= filteredResults.length;
            const nextCursor = isDone ? null : String(endIndex);

            const page = await Promise.all(
                pageItems.map(async (listing) => ({
                    ...listing,
                    imageUrl: listing.images?.length
                        ? await ctx.storage.getUrl(listing.images[0])
                        : null,
                }))
            );

            return {
                page,
                isDone,
                continueCursor: nextCursor || "",
            };

        } else {
            const result = await query.paginate(args.paginationOpts);

            // Get image URLs
            const page = await Promise.all(
                result.page.map(async (listing) => ({
                    ...listing,
                    imageUrl:
                        listing.images?.length
                            ? await ctx.storage.getUrl(listing.images[0])
                            : null,
                }))
            );

            return { ...result, page };
        }
    },
});


// export const getOpenListingsByType = query({
//     args: {
//         type: v.union(v.literal("lost"), v.literal("found")),
//         paginationOpts: paginationOptsValidator,
//     },
//     handler: async (ctx, args) => {
//         // Apply status filter BEFORE pagination
//         const listings = await ctx.db
//             .query("listings")
//             .withIndex("by_type", q => q.eq("type", args.type))
//             .filter(f => f.eq(f.field("status"), "open"))
//             .paginate(args.paginationOpts);

//         return listings;
//     },
// });



export const getListingById = query({
    args: { id: v.id("listings") },
    handler: async (ctx, args) => {
        const listing = await ctx.db.get(args.id);
        if (!listing) return null;

        // Fetch all image URLs from storage
        const imageUrls = await Promise.all(
            (listing.images || []).map((imageId) => ctx.storage.getUrl(imageId))
        );

        return {
            ...listing,
            imageUrls: imageUrls.filter((url): url is string => url !== null),
        };
    },
})

export const getListingByUser = query({
    args: { clerkUserId: v.string() },
    handler: async (ctx, args) => {
        const listings = await ctx.db
            .query("listings")
            .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
            .collect();

        return await Promise.all(
            listings.map(async (listing) => ({
                ...listing,
                imageUrl:
                    listing.images?.length
                        ? await ctx.storage.getUrl(listing.images[0])
                        : null,
            }))
        );
    },
})

// export const getOpenListingsByCategory = query({
//     args: {
//         category: ItemCategory,
//         paginationOpts: paginationOptsValidator,
//     },
//     handler: async (ctx, args) => {
//         // Use the specific category index
//         const listings = await ctx.db
//             .query("listings")
//             .withIndex("by_category", q => q.eq("categories", args.category as any))
//             .filter(f => f.eq(f.field("status"), "open"))
//             .paginate(args.paginationOpts);

//         return listings;
//     },
// });
