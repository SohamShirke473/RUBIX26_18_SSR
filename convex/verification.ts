import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";

export const getClaimStatus = query({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) return null;

        const claim = await ctx.db
            .query("verificationClaims")
            .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
            .filter((q) => q.eq(q.field("claimantClerkUserId"), user.subject))
            .first();

        return claim; // Returns null or the claim object
    },
});

export const getPendingClaims = query({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) return [];

        const listing = await ctx.db.get(args.listingId);
        if (!listing || listing.clerkUserId !== user.subject) return []; // Only owner can see

        // Fetch claims for this listing
        // Note: we can filter by status if we want only pending
        const claims = await ctx.db
            .query("verificationClaims")
            .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
            .collect();

        // Join with user details? For now just return claims.
        return claims;
    },
});

// 1. User (Claimant) initiates a verification request
export const initiateClaim = mutation({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Unauthorized");

        const existing = await ctx.db
            .query("verificationClaims")
            .withIndex("by_listing", (q) => q.eq("listingId", args.listingId))
            .filter((q) => q.eq(q.field("claimantClerkUserId"), user.subject))
            .first();

        if (existing) throw new Error("Claim already exists");

        await ctx.db.insert("verificationClaims", {
            listingId: args.listingId,
            claimantClerkUserId: user.subject,
            status: "pending",
            createdAt: Date.now(),
        });
    },
});

// 2. Finder approves the claim -> Triggers AI generation
export const approveClaim = mutation({
    args: { claimId: v.id("verificationClaims") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Unauthorized");

        const claim = await ctx.db.get(args.claimId);
        if (!claim) throw new Error("Claim not found");

        const listing = await ctx.db.get(claim.listingId);
        if (!listing) throw new Error("Listing not found");

        // Verify the current user is the owner of the listing (the Finder)
        if (listing.clerkUserId !== user.subject) {
            throw new Error("Unauthorized: Only the finder can approve claims");
        }

        // Schedule the AI action
        await ctx.scheduler.runAfter(0, api.verificationActions.generateQuestions, {
            claimId: args.claimId,
            listingId: listing._id,
        });

        // Set status to 'generating' so UI can reflect the state
        await ctx.db.patch(args.claimId, { status: "generating" });
    },
});

// 3. Internal mutation called by AI action to save questions
export const updateClaimWithQuestions = internalMutation({
    args: {
        claimId: v.id("verificationClaims"),
        questions: v.array(v.object({
            question: v.string(),
            options: v.array(v.string()),
            correctIndex: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.claimId, {
            generatedQuestions: args.questions,
            status: "questions_generated",
        });
    },
});

// 4. Claimant submits answers
export const submitVerificationAnswers = mutation({
    args: {
        claimId: v.id("verificationClaims"),
        answers: v.array(v.object({
            question: v.string(),
            answerIndex: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Unauthorized");

        const claim = await ctx.db.get(args.claimId);
        if (!claim) throw new Error("Claim not found");
        if (claim.claimantClerkUserId !== user.subject) throw new Error("Unauthorized");
        if (claim.status !== "questions_generated" || !claim.generatedQuestions) {
            throw new Error("Invalid claim state");
        }

        // Validate answers
        let correctCount = 0;
        const total = claim.generatedQuestions.length;

        // Naive matching by index (assuming order is preserved or questions match text)
        // Better: Map by question text or ID. For now assume order matches.
        for (let i = 0; i < total; i++) {
            const serverQ = claim.generatedQuestions[i];
            const clientA = args.answers[i];

            if (serverQ.question === clientA.question && serverQ.correctIndex === clientA.answerIndex) {
                correctCount++;
            }
        }

        // Threshold: All correct? Or allow 1 mistake? 
        // Strict for now: All must be correct.
        const isApproved = correctCount === total;

        await ctx.db.patch(args.claimId, {
            answers: args.answers,
            status: isApproved ? "resolved" : "rejected", // or 'failed'
            reviewedAt: Date.now(),
        });

        if (isApproved) {
            const listing = await ctx.db.get(claim.listingId);
            if (listing) {
                await ctx.scheduler.runAfter(0, internal.email.sendVerificationSuccessNotifications, {
                    listingId: listing._id,
                    itemName: listing.title,
                    founderId: listing.clerkUserId,
                    claimantId: user.subject,
                });
            }
        }

        return isApproved ? "resolved" : "rejected";
    },
});

// 5. Reveal Contact Info (Helper or Mutation) implementation
// Actually, the client can just query the claim status. If approved, we can have a query that returns the finder's contact info.
// ... (omitted for brevity, can be added if needed, or handled in getListing/getClaim)

// 6. Resolve Listing
export const resolveListing = mutation({
    args: { listingId: v.id("listings") },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Unauthorized");

        const listing = await ctx.db.get(args.listingId);
        if (!listing) throw new Error("Listing not found");
        if (listing.clerkUserId !== user.subject) throw new Error("Unauthorized");

        await ctx.db.patch(args.listingId, {
            status: "resolved",
            updatedAt: Date.now(),
        });
    },
});
