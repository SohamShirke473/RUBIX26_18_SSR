import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
export const getOrCreateConversation = mutation({
    args: {
        listingId: v.id("listings"),
        participantIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("conversations")
            .withIndex("by_listing", q =>
                q.eq("listingId", args.listingId)
            )
            .first();

        if (existing) return existing._id;

        return await ctx.db.insert("conversations", {
            listingId: args.listingId,
            participantIds: args.participantIds,
            createdAt: Date.now(),
        });
    },
});

export const sendMessage = mutation({
    args: {
        conversationId: v.id("conversations"),
        content: v.string(),
        senderClerkUserId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderClerkUserId: args.senderClerkUserId,
            content: args.content,
            isRead: false,
            createdAt: Date.now(),
        });

        await ctx.db.patch(args.conversationId, {
            lastMessage: args.content,
            lastMessageAt: Date.now(),
        });
    },
});
export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("messages")
            .withIndex("by_conversation", q =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .collect();
    },
});
