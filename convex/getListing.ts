import { query } from "./_generated/server";
import { v } from "convex/values";
import { ItemCategory } from "./schema";
import { paginationOptsValidator } from "convex/server";
export const getAllListings = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("listings")
            .withIndex("by_status", q => q.eq("status", "open"))
            .paginate(args.paginationOpts);
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