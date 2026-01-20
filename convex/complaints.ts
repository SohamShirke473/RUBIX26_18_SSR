import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new complaint
export const createComplaint = mutation({
    args: {
        title: v.string(),
        description: v.string(),
        category: v.union(
            v.literal("abuse"),
            v.literal("spam"),
            v.literal("inappropriate_content"),
            v.literal("harassment"),
            v.literal("other")
        ),
        listingId: v.optional(v.id("listings")),
        evidence: v.array(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("You must be logged in to file a complaint");
        }

        const now = Date.now();

        const complaintId = await ctx.db.insert("complaints", {
            title: args.title,
            description: args.description,
            category: args.category,
            clerkUserId: identity.subject,
            listingId: args.listingId,
            evidence: args.evidence,
            status: "open",
            createdAt: now,
            updatedAt: now,
        });

        return complaintId;
    },
});

// Get all complaints filed by the current user
export const getUserComplaints = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const complaints = await ctx.db
            .query("complaints")
            .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
            .order("desc")
            .collect();

        // Fetch listing details for each complaint if they have a listingId
        const complaintsWithListings = await Promise.all(
            complaints.map(async (complaint) => {
                if (complaint.listingId) {
                    const listing = await ctx.db.get(complaint.listingId);
                    return {
                        ...complaint,
                        listing: listing
                            ? {
                                _id: listing._id,
                                title: listing.title,
                                type: listing.type,
                            }
                            : null,
                    };
                }
                return { ...complaint, listing: null };
            })
        );

        return complaintsWithListings;
    },
});

// Get a specific complaint by ID
export const getComplaintById = query({
    args: {
        complaintId: v.id("complaints"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("You must be logged in to view complaints");
        }

        const complaint = await ctx.db.get(args.complaintId);
        if (!complaint) {
            throw new Error("Complaint not found");
        }

        // Users can only view their own complaints unless admin
        // For now, we'll just return if it's the user's complaint
        // Admin check will be handled separately
        if (complaint.clerkUserId !== identity.subject) {
            throw new Error("You don't have permission to view this complaint");
        }

        // Fetch listing details if available
        let listing = null;
        if (complaint.listingId) {
            const listingData = await ctx.db.get(complaint.listingId);
            if (listingData) {
                listing = {
                    _id: listingData._id,
                    title: listingData.title,
                    type: listingData.type,
                    locationName: listingData.locationName,
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

// Get all complaints for a specific listing
export const getComplaintsForListing = query({
    args: {
        listingId: v.id("listings"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const complaints = await ctx.db
            .query("complaints")
            .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
            .order("desc")
            .collect();

        // Only return complaints filed by the current user
        return complaints.filter((c) => c.clerkUserId === identity.subject);
    },
});

// Update complaint status (admin only - will be called from admin.ts)
export const updateComplaintStatus = mutation({
    args: {
        complaintId: v.id("complaints"),
        status: v.union(
            v.literal("open"),
            v.literal("in-review"),
            v.literal("resolved"),
            v.literal("closed")
        ),
        adminNotes: v.optional(v.string()),
        reviewedBy: v.string(),
    },
    handler: async (ctx, args) => {
        const complaint = await ctx.db.get(args.complaintId);
        if (!complaint) {
            throw new Error("Complaint not found");
        }

        const now = Date.now();

        await ctx.db.patch(args.complaintId, {
            status: args.status,
            adminNotes: args.adminNotes,
            reviewedBy: args.reviewedBy,
            reviewedAt: now,
            updatedAt: now,
        });

        return { success: true };
    },
});
