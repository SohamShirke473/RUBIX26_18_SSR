"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import { createClerkClient } from "@clerk/backend";

const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

export const sendVerificationSuccessNotifications = internalAction({
    args: {
        listingId: v.id("listings"),
        itemName: v.string(),
        founderId: v.string(),
        claimantId: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Fetch emails from Clerk
        // We try/catch this block to avoid failing the action if Clerk is misconfigured
        let founderEmail: string | null = null;
        let claimantEmail: string | null = null;

        try {
            if (process.env.CLERK_SECRET_KEY) {
                const [founder, claimant] = await Promise.all([
                    clerkClient.users.getUser(args.founderId),
                    clerkClient.users.getUser(args.claimantId),
                ]);
                founderEmail = founder.emailAddresses[0]?.emailAddress;
                claimantEmail = claimant.emailAddresses[0]?.emailAddress;
            } else {
                console.warn("CLERK_SECRET_KEY not set. Cannot fetch user emails.");
            }
        } catch (error) {
            console.error("Failed to fetch users from Clerk:", error);
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.log("RESEND_API_KEY not set. Skipping email sending.");
            console.log(`[Email Mock] To Founder (${args.founderId} / ${founderEmail}): Match Resolved for ${args.itemName}`);
            console.log(`[Email Mock] To Claimant (${args.claimantId} / ${claimantEmail}): Match Resolved for ${args.itemName}`);
            return;
        }

        const resend = new Resend(resendApiKey);
        const subject = `Match Resolved: ${args.itemName}`;

        // Email content
        const htmlContent = (recipientRole: "Founder" | "Claimant") => `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #0F766E;">Match Resolved!</h1>
        <p>Good news! The verification for the item <strong>${args.itemName}</strong> has been successfully resolved.</p>
        <p>A match has been confirmed between the founder and the claimant.</p>
        <div style="background-color: #F3F4F6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Next Steps:</p>
          <p style="margin-top: 5px;">Please verify and discuss the details in the chat to arrange the handover.</p>
        </div>
        <p style="font-size: 14px; color: #6B7280;">This message was sent securely by Rubix.</p>
      </div>
    `;

        const emailsToSend = [];

        // Send to Founder
        if (founderEmail) {
            emailsToSend.push(
                resend.emails.send({
                    from: "Rubix Notifications <noreply@resend.dev>", // Or your verified domain
                    to: [founderEmail],
                    subject: subject,
                    html: htmlContent("Founder"),
                })
            );
        }

        // Send to Claimant
        if (claimantEmail) {
            emailsToSend.push(
                resend.emails.send({
                    from: "Rubix Notifications <noreply@resend.dev>",
                    to: [claimantEmail],
                    subject: subject,
                    html: htmlContent("Claimant"),
                })
            );
        }

        await Promise.allSettled(emailsToSend);
    },
});

