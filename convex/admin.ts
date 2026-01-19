import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Admin user IDs (hardcoded for now - can be extended to use Clerk organization roles)
const ADMIN_IDS = ["user_38SW93hP4I75xCjw2BlSGgpCeHP"];

// ============================================
// INTERNAL HELPERS
// ============================================

function verifyAdminAccess(userId: string) {
  if (!ADMIN_IDS.includes(userId)) {
    throw new Error("Admin access required");
  }
}

// ============================================
// ADMIN QUERIES
// ============================================

export const getAllListingsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    // Fetch all listings with owner details
    const listings = await ctx.db
      .query("listings")
      .collect();

    // Enrich with image URLs
    const enriched = await Promise.all(
      listings.map(async (listing) => ({
        ...listing,
        imageUrl: listing.images?.length
          ? await ctx.storage.getUrl(listing.images[0])
          : null,
      }))
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    const listings = await ctx.db.query("listings").collect();

    const stats = {
      totalListings: listings.length,
      openListings: listings.filter(l => l.status === "open").length,
      matchedListings: listings.filter(l => l.status === "matched").length,
      resolvedListings: listings.filter(l => l.status === "resolved").length,
      lostListings: listings.filter(l => l.type === "lost").length,
      foundListings: listings.filter(l => l.type === "found").length,
      uniqueUsers: new Set(listings.map(l => l.clerkUserId)).size,
    };

    return stats;
  },
});

export const getAllConversationsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    const conversations = await ctx.db.query("conversations").order("desc").collect();

    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const listing = await ctx.db.get(conv.listingId);
        return {
          ...conv,
          listingTitle: listing?.title || "Unknown Listing",
          listingImage: listing?.images && listing.images.length > 0 ? await ctx.storage.getUrl(listing.images[0]) : null,
        };
      })
    );

    return enrichedConversations;
  },
});

export const getMessagesForAdmin = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

// ============================================
// ADMIN MUTATIONS
// ============================================

export const resolveListing = mutation({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");

    await ctx.db.patch(args.listingId, {
      status: "resolved",
      updatedAt: Date.now(),
    });

    return args.listingId;
  },
});

export const deleteListing = mutation({
  args: {
    listingId: v.id("listings"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");

    // Delete related records
    // Delete matches
    const matchesAsLost = await ctx.db
      .query("matches")
      .withIndex("by_lost", q => q.eq("lostListingId", args.listingId))
      .collect();

    const matchesAsFound = await ctx.db
      .query("matches")
      .withIndex("by_found", q => q.eq("foundListingId", args.listingId))
      .collect();

    for (const match of [...matchesAsLost, ...matchesAsFound]) {
      await ctx.db.delete(match._id);
    }

    // Delete conversations
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_listing", q => q.eq("listingId", args.listingId))
      .first();

    if (conversation) {
      // Delete messages
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversation", q => q.eq("conversationId", conversation._id))
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      await ctx.db.delete(conversation._id);
    }

    // Delete the listing itself
    await ctx.db.delete(args.listingId);

    return { success: true, deletedId: args.listingId };
  },
});

export const verifyAdminUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    return ADMIN_IDS.includes(identity.subject);
  },
});
