import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export const ItemCategory = v.union(
    v.literal("wallet"),
    v.literal("phone"),
    v.literal("keys"),
    v.literal("bag"),
    v.literal("documents"),
    v.literal("electronics"),
    v.literal("jewelry"),
    v.literal("clothing"),
    v.literal("id_card"),
    v.literal("cash"),
    v.literal("other")
);


export default defineSchema({
    listings: defineTable({
        // item details
        title: v.string(),
        description: v.string(),
        images: v.array(v.id("_storage")),

        type: v.union(v.literal("lost"), v.literal("found")),
        categories: v.array(ItemCategory),

        color: v.optional(v.string()),
        brand: v.optional(v.string()),

        // location
        locationName: v.string(),
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),

        // lifecycle
        status: v.union(
            v.literal("open"),
            v.literal("matched"),
            v.literal("resolved")
        ),

        // Clerk user reference
        clerkUserId: v.string(),

        // Search field
        searchText: v.string(),

        // Vector embedding for semantic matching (768 dimensions from Gemini)
        embedding: v.optional(v.array(v.float64())),

        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_type", ["type"])
        .index("by_user", ["clerkUserId"])
        .index("by_status", ["status"])
        .searchIndex("search_text", {
            searchField: "searchText",
            filterFields: ["status", "type"],
        })
        .vectorIndex("by_embedding", {
            vectorField: "embedding",
            dimensions: 768,
            filterFields: ["type", "status"],
        }),
    matches: defineTable({
        lostListingId: v.id("listings"),
        foundListingId: v.id("listings"),

        score: v.number(),

        status: v.union(
            v.literal("suggested"),
            v.literal("confirmed"),
            v.literal("rejected")
        ),

        createdAt: v.number(),
    })
        .index("by_lost", ["lostListingId"])
        .index("by_found", ["foundListingId"]),

    conversations: defineTable({
        listingId: v.id("listings"),
        participantIds: v.array(v.string()),
        lastMessage: v.optional(v.string()),
        lastMessageAt: v.optional(v.number()),
        createdAt: v.number(),
    }).index("by_listing", ["listingId"]),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderClerkUserId: v.string(),
        isRead: v.boolean(),
        content: v.string(),
        createdAt: v.number(),
    }).index("by_conversation", ["conversationId"]),

    verificationClaims: defineTable({
        listingId: v.id("listings"),
        claimantClerkUserId: v.string(),

        answers: v.array(
            v.object({
                question: v.string(),
                answer: v.string(),
            })
        ),

        status: v.union(
            v.literal("pending"),
            v.literal("approved"),
            v.literal("rejected")
        ),

        createdAt: v.number(),
        reviewedAt: v.optional(v.number()),
    }).index("by_listing", ["listingId"]),
});