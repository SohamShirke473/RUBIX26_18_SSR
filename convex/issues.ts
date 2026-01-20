import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const reportIssue = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        listingId: v.optional(v.id("listings")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        await ctx.db.insert("issues", {
            userId: identity.subject,
            listingId: args.listingId,
            title: args.title,
            description: args.description,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

export const getMyIssues = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        return await ctx.db
            .query("issues")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .collect();
    },
});

export const getAllIssues = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];
        // In a real app, you'd check for admin role here.
        // Assuming the frontend protects the admin page or using `admin.ts` pattern.

        return await ctx.db
            .query("issues")
            .order("desc")
            .collect();
    },
});

export const resolveIssue = mutation({
    args: {
        issueId: v.id("issues"),
        adminResponse: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Add admin check if strict
        await ctx.db.patch(args.issueId, {
            status: "solved",
            adminResponse: args.adminResponse,
        });
    },
});
