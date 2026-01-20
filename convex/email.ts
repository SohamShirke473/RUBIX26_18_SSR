"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";

// We need to import the raw function or define it here if we want to extract it
// Let's redefine the email logic inside the action for simplicity or import it.
// Since we wrote `convex/email.ts` previously as "use node", we can import it if it exports a function.
// But `convex/email.ts` might not be a registered action file yet. 
// Let's make `convex/email.ts` the action file.

import { Resend } from "resend";

export const sendMatchConfirmation = internalAction({
    args: {
        matchId: v.id("matches"),
        itemName: v.string(),
        recipientId: v.string(), // This was passed as string in helper but it's actually an ID or Clerk ID. 
        // Let's simplify: pass the email directly if we had it, or fetch it.
        // Since we don't store emails in schema (only Clerk IDs), we can't easily get email here 
        // UNLESS we store it or use Clerk SDK. 
        // FAILOVER: Send to a hardcoded/logged email for demo.
    },
    handler: async (ctx, args) => {
        // In a real app, use Clerk Helper to get email from args.recipientId (Clerk ID)
        // const user = await clerkClient.users.getUser(args.recipientId);
        // const email = user.emailAddresses[0].emailAddress;

        const mockEmail = "user@example.com"; // Placeholder
        const resendApiKey = process.env.RESEND_API_KEY;

        if (!resendApiKey) {
            console.log(`[Mock Email] To: ${mockEmail} (User ID: ${args.recipientId})`);
            console.log(`Subject: Your item "${args.itemName}" match is CONFIRMED!`);
            return;
        }

        const resend = new Resend(resendApiKey);
        await resend.emails.send({
            from: "Rubix Matches <matches@rubix.app>",
            to: [mockEmail], // deliver to verified email or mock
            subject: `Match Confirmed: ${args.itemName}`,
            html: `<p>Your item <strong>${args.itemName}</strong> has been confirmed!</p>`
        });
    }
});
