import { mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { ItemCategory } from "./schema";

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        return await ctx.storage.generateUploadUrl();
    },
});


export const createListing = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        type: v.union(v.literal("lost"), v.literal("found")),
        categories: v.array(ItemCategory),

        locationName: v.string(),
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),

        images: v.array(v.id("_storage")),

        color: v.optional(v.string()),
        brand: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const listingId = await ctx.db.insert("listings", {
            ...args,
            clerkUserId: identity.subject,
            status: "open",
            searchText: args.title + " " + args.description,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Schedule the matching process to run in the background
        // This generates embeddings and finds potential matches
        await ctx.scheduler.runAfter(0, internal.matching.processNewListing, {
            listingId,
        });

        return listingId;
    },
});