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
        let q = ctx.db
            .query("listings")
            .withIndex("by_status", q => q.eq("status", "open"));

        if (args.filterType) {
            q = q.filter(f => f.eq(f.field("type"), args.filterType));
        }

        const result = await q.paginate(args.paginationOpts);

        const page = await Promise.all(
            result.page.map(async (listing) => ({
                ...listing,
                imageUrl:
                    listing.images?.length
                        ? await ctx.storage.getUrl(listing.images[0])
                        : null,
            }))
        );

        const filteredPage =
            args.filterCategory && args.filterCategory.length > 0
                ? page.filter(l =>
                    l.categorys.some(c =>
                        args.filterCategory!.includes(c)
                    )
                )
                : page;

        return { ...result, page: filteredPage };
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
        const query = ctx.db.query("listings").withSearchIndex(
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

        const result = await query.paginate(args.paginationOpts);

        const page = await Promise.all(
            result.page.map(async (listing) => ({
                ...listing,
                imageUrl:
                    listing.images?.length
                        ? await ctx.storage.getUrl(listing.images[0])
                        : null,
            }))
        );

        const filteredPage =
            args.filterCategory && args.filterCategory.length > 0
                ? page.filter(l =>
                    l.categorys.some(c =>
                        args.filterCategory!.includes(c)
                    )
                )
                : page;

        return { ...result, page: filteredPage };
    },
});


export const getOpenListingsByType = query({
    args: {
        type: v.union(v.literal("lost"), v.literal("found")),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const listings = await ctx.db
            .query("listings")
            .withIndex("by_type", q => q.eq("type", args.type))
            .paginate(args.paginationOpts);

        return {
            ...listings,
            page: listings.page.filter(l => l.status === "open")
        }
    },
});



export const getListingById = query({
    args: { id: v.id("listings") },
    handler: async (ctx, args) => {

        return await ctx.db.get(args.id);
    },
})

export const getListingByUser = query({
    args: { clerkUserId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("listings")
            .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
            .collect();
    },
})

export const getOpenListingsByCategory = query({
    args: {
        category: ItemCategory,
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, args) => {
        const listings = await ctx.db
            .query("listings")
            .withIndex("by_status", q => q.eq("status", "open"))
            .paginate(args.paginationOpts);

        return {
            ...listings,
            page: listings.page.filter(l =>
                l.categorys.includes(args.category)
            )
        }
    },
});