"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Loader2, Check, X, ShieldAlert } from "lucide-react";
import { useState } from "react";



export default function ClaimApprovalList({ listingId, isResolved }: { listingId: Id<"listings">, isResolved?: boolean }) {
    const claims = useQuery(api.verification.getPendingClaims, { listingId });
    const approveClaim = useMutation(api.verification.approveClaim);
    const resolveListing = useMutation(api.verification.resolveListing);
    // const rejectClaim = useMutation(api.verification.rejectClaim); // Need to add this if desired

    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    if (!claims) return null; // Loading

    if (claims.length === 0) return null; // No claims

    const handleApprove = async (claimId: Id<"verificationClaims">) => {
        setIsProcessing(claimId);
        try {
            await approveClaim({ claimId });
        } catch (error) {
            console.error("Failed to approve claim:", error);
        } finally {
            setIsProcessing(null);
        }
    };

    if (isResolved) {
        return (
            <div className="border border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900 rounded-xl p-4 flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                <Check className="w-5 h-5" />
                <span className="font-medium">You can now chat with the Verified Owner</span>
            </div>
        );
    }

    return (
        <div className="border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-900 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-orange-800 dark:text-orange-300 font-semibold">
                <ShieldAlert className="w-5 h-5" />
                <h3>Verification Requests</h3>
            </div>

            <div className="space-y-3">
                {claims.filter(c => c.status === "pending").map((claim) => (
                    <div key={claim._id} className="bg-white dark:bg-slate-900 p-3 rounded-lg border flex items-center justify-between gap-4">
                        <div className="text-sm">
                            <p className="font-medium">User ID: {claim.claimantClerkUserId.slice(0, 8)}...</p>
                            <p className="text-xs text-muted-foreground">Requested {new Date(claim.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
                                onClick={() => handleApprove(claim._id)}
                                disabled={isProcessing === claim._id}
                            >
                                {isProcessing === claim._id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    "Approve & Verify"
                                )}
                            </Button>
                            {/* Reject button could go here */}
                        </div>
                    </div>
                ))}

                {claims.filter(c => c.status === "generating").map((claim) => (
                    <div key={claim._id} className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-200 dark:border-purple-800 flex items-center gap-3 animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                        <div className="text-sm text-purple-700 dark:text-purple-300">
                            Generating verification questions with AI...
                        </div>
                    </div>
                ))}

                {claims.some(c => c.status === "questions_generated") && (
                    <p className="text-xs text-muted-foreground italic">
                        {claims.filter(c => c.status === "questions_generated").length} user(s) currently verifying...
                    </p>
                )}
                {claims.some(c => c.status === "approved") && (
                    <div className="space-y-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                        <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            Item successfully verified!
                        </div>
                        <Button
                            className="w-full bg-slate-900 text-white hover:bg-slate-800"
                            onClick={() => resolveListing({ listingId })}
                        >
                            Mark as Resolved
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
