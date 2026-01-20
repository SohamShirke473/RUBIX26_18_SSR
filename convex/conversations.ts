import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { filterProfanity } from "./moderation";

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
        senderName: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const { isClean } = filterProfanity(args.content);
        if (!isClean) {
            throw new Error("Message contains inappropriate language.");
        }

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        const listing = await ctx.db.get(conversation.listingId);
        if (!listing) throw new Error("Listing not found");

        // Enforce Chat Restriction for Resolved Listings
        if (listing.status === "resolved") {
            if (!conversation.participantIds.includes(args.senderClerkUserId)) {
                throw new Error("This listing is resolved. Chat is restricted to the owner and verified user.");
            }
        }

        await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderClerkUserId: args.senderClerkUserId,
            senderName: args.senderName,
            content: args.content,
            isRead: false,
            createdAt: Date.now(),
        });

        if (conversation && !conversation.participantIds.includes(args.senderClerkUserId)) {
            await ctx.db.patch(args.conversationId, {
                participantIds: [...conversation.participantIds, args.senderClerkUserId],
                lastMessage: args.content,
                lastMessageAt: Date.now(),
            });
        } else {
            await ctx.db.patch(args.conversationId, {
                lastMessage: args.content,
                lastMessageAt: Date.now(),
            });
        }
    },
});
export const getMessages = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) {
            return []; // Conversation deleted or not found, return empty messages
        }

        if (!conversation.participantIds.includes(identity.subject)) {
            // User is not a participant (e.g. removed after resolution)
            return [];
        }

        return await ctx.db
            .query("messages")
            .withIndex("by_conversation", q =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .collect();
    },
});

export const getConversation = query({
    args: {
        listingId: v.id("listings"),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("conversations")
            .withIndex("by_listing", q => q.eq("listingId", args.listingId))
            .first();
    },
});
