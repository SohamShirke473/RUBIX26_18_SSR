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

// ============================================
// COMPLAINT ADMIN QUERIES & MUTATIONS
// ============================================

export const getAllComplaints = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in-review"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
    category: v.optional(
      v.union(
        v.literal("abuse"),
        v.literal("spam"),
        v.literal("inappropriate_content"),
        v.literal("harassment"),
        v.literal("other")
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    // Build query with optional filters
    let complaints;
    if (args.status) {
      complaints = await ctx.db
        .query("complaints")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    } else if (args.category) {
      complaints = await ctx.db
        .query("complaints")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .order("desc")
        .collect();
    } else {
      complaints = await ctx.db
        .query("complaints")
        .order("desc")
        .collect();
    }

    // Enrich with user and listing information
    const enriched = await Promise.all(
      complaints.map(async (complaint) => {
        let listing = null;
        if (complaint.listingId) {
          const listingData = await ctx.db.get(complaint.listingId);
          if (listingData) {
            listing = {
              _id: listingData._id,
              title: listingData.title,
              type: listingData.type,
            };
          }
        }

        return {
          ...complaint,
          listing,
        };
      })
    );

    return enriched;
  },
});

export const getComplaintStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    const complaints = await ctx.db.query("complaints").collect();

    const stats = {
      totalComplaints: complaints.length,
      openComplaints: complaints.filter((c) => c.status === "open").length,
      inReviewComplaints: complaints.filter((c) => c.status === "in-review")
        .length,
      resolvedComplaints: complaints.filter((c) => c.status === "resolved")
        .length,
      closedComplaints: complaints.filter((c) => c.status === "closed").length,
      abuseComplaints: complaints.filter((c) => c.category === "abuse").length,
      spamComplaints: complaints.filter((c) => c.category === "spam").length,
      inappropriateComplaints: complaints.filter(
        (c) => c.category === "inappropriate_content"
      ).length,
      harassmentComplaints: complaints.filter(
        (c) => c.category === "harassment"
      ).length,
      otherComplaints: complaints.filter((c) => c.category === "other").length,
    };

    return stats;
  },
});

export const resolveComplaint = mutation({
  args: {
    complaintId: v.id("complaints"),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    const complaint = await ctx.db.get(args.complaintId);
    if (!complaint) throw new Error("Complaint not found");

    const now = Date.now();

    await ctx.db.patch(args.complaintId, {
      status: "resolved",
      adminNotes: args.adminNotes,
      reviewedBy: identity.subject,
      reviewedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const deleteComplaint = mutation({
  args: {
    complaintId: v.id("complaints"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    const complaint = await ctx.db.get(args.complaintId);
    if (!complaint) throw new Error("Complaint not found");

    // Soft delete by marking as closed
    const now = Date.now();
    await ctx.db.patch(args.complaintId, {
      status: "closed",
      reviewedBy: identity.subject,
      reviewedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const updateComplaintAdmin = mutation({
  args: {
    complaintId: v.id("complaints"),
    status: v.union(
      v.literal("open"),
      v.literal("in-review"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    adminNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    const complaint = await ctx.db.get(args.complaintId);
    if (!complaint) throw new Error("Complaint not found");

    const now = Date.now();

    await ctx.db.patch(args.complaintId, {
      status: args.status,
      adminNotes: args.adminNotes,
      reviewedBy: identity.subject,
      reviewedAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});

export const getComplaintDetails = query({
  args: {
    complaintId: v.id("complaints"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    verifyAdminAccess(identity.subject);

    const complaint = await ctx.db.get(args.complaintId);
    if (!complaint) throw new Error("Complaint not found");

    // Fetch listing details if available
    let listing = null;
    if (complaint.listingId) {
      const listingData = await ctx.db.get(complaint.listingId);
      if (listingData) {
        const imageUrl =
          listingData.images && listingData.images.length > 0
            ? await ctx.storage.getUrl(listingData.images[0])
            : null;
        listing = {
          _id: listingData._id,
          title: listingData.title,
          type: listingData.type,
          locationName: listingData.locationName,
          imageUrl,
        };
      }
    }

    // Fetch evidence URLs
    const evidenceUrls = await Promise.all(
      complaint.evidence.map(async (storageId) => {
        const url = await ctx.storage.getUrl(storageId);
        return { storageId, url };
      })
    );

    return {
      ...complaint,
      listing,
      evidenceUrls,
    };
  },
});
