import { query } from "./_generated/server";
import { v } from "convex/values";
import { ItemCategory } from "./schema";
export const getAllListings = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("listings")
            .withIndex("by_status", q => q.eq("status", "open"))
            .collect();
    },
});

export const getOpenListingsByType = query({
    args: {
        type: v.union(v.literal("lost"), v.literal("found")),
    },
    handler: async (ctx, args) => {
        const listings = await ctx.db
            .query("listings")
            .withIndex("by_type", q => q.eq("type", args.type))
            .collect();

        return listings.filter(l => l.status === "open");
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
    },
    handler: async (ctx, args) => {
        const listings = await ctx.db
            .query("listings")
            .withIndex("by_status", q => q.eq("status", "open"))
            .collect();

        return listings.filter(l =>
            l.categorys.includes(args.category)
        );
    },
});