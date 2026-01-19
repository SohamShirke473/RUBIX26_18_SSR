import { mutation } from "./_generated/server";
import { v } from "convex/values";

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
        category: v.string(),

        locationName: v.string(),
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),

        images: v.array(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        return await ctx.db.insert("listings", {
            ...args,
            clerkUserId: identity.subject,
            status: "open",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});
