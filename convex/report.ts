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


// Maximum description length (500 characters)
const MAX_DESCRIPTION_LENGTH = 500;

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

        // Validate description length
        if (args.description.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error(`Description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters. Current length: ${args.description.length}`);
        }

        const listingId = await ctx.db.insert("listings", {
            ...args,
            clerkUserId: identity.subject,
            status: "open",
            searchText: args.title + " " + args.description + " " + args.locationName + " " + args.color + " " + args.brand,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Schedule the matching process to run in the background
        // This generates embeddings and finds potential matches
        await ctx.scheduler.runAfter(0, internal.matching.processNewListing, {
            listingId,
        });

        await ctx.db.insert("conversations", {
            listingId,
            participantIds: [identity.subject],
            createdAt: Date.now(),
        });

        return listingId;
    },
});

export const updateListing = mutation({
    args: {
        listingId: v.id("listings"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        categories: v.optional(v.array(ItemCategory)),
        locationName: v.optional(v.string()),
        latitude: v.optional(v.number()),
        longitude: v.optional(v.number()),
        images: v.optional(v.array(v.id("_storage"))),
        color: v.optional(v.string()),
        brand: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Verify ownership
        const listing = await ctx.db.get(args.listingId);
        if (!listing) throw new Error("Listing not found");
        if (listing.clerkUserId !== identity.subject) throw new Error("Not authorized to edit this listing");

        // Validate description length if provided
        if (args.description && args.description.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error(`Description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters. Current length: ${args.description.length}`);
        }

        // Build update object with only provided fields
        const updateData: any = {
            updatedAt: Date.now(),
        };

        if (args.title !== undefined) updateData.title = args.title;
        if (args.description !== undefined) updateData.description = args.description;
        if (args.categories !== undefined) updateData.categories = args.categories;
        if (args.locationName !== undefined) updateData.locationName = args.locationName;
        if (args.latitude !== undefined) updateData.latitude = args.latitude;
        if (args.longitude !== undefined) updateData.longitude = args.longitude;
        if (args.images !== undefined) updateData.images = args.images;
        if (args.color !== undefined) updateData.color = args.color;
        if (args.brand !== undefined) updateData.brand = args.brand;

        // Update searchText if title or description changed
        if (args.title !== undefined || args.description !== undefined) {
            const newTitle = args.title ?? listing.title;
            const newDescription = args.description ?? listing.description;
            updateData.searchText = newTitle + " " + newDescription;
        }

        await ctx.db.patch(args.listingId, updateData);
        return args.listingId;
    },
});
