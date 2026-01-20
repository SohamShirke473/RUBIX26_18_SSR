"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, Loader2, ExternalLink, FileText } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";
import Image from "next/image";

const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
        abuse: "Abuse",
        spam: "Spam",
        inappropriate_content: "Inappropriate Content",
        harassment: "Harassment",
        other: "Other",
    };
    return labels[category] || category;
};

const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
        open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        "in-review": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
};

interface ComplaintDetailsDialogProps {
    complaintId: Id<"complaints">;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ComplaintDetailsDialog({
    complaintId,
    open,
    onOpenChange,
}: ComplaintDetailsDialogProps) {
    const { toast } = useToast();
    const complaint = useQuery(api.admin.getComplaintDetails, { complaintId });
    const updateComplaint = useMutation(api.admin.updateComplaintAdmin);
    const resolveComplaint = useMutation(api.admin.resolveComplaint);

    const [adminNotes, setAdminNotes] = useState("");
    const [status, setStatus] = useState<"open" | "in-review" | "resolved" | "closed">("open");
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            await updateComplaint({
                complaintId,
                status,
                adminNotes: adminNotes || undefined,
            });
            toast.success("Complaint updated", {
                description: "The complaint has been updated successfully",
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Update failed", {
                description: "Failed to update complaint",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleResolve = async () => {
        setIsUpdating(true);
        try {
            await resolveComplaint({
                complaintId,
                adminNotes: adminNotes || undefined,
            });
            toast.success("Complaint resolved", {
                description: "The complaint has been marked as resolved",
            });
            onOpenChange(false);
        } catch (error) {
            console.error("Resolve error:", error);
            toast.error("Resolve failed", {
                description: "Failed to resolve complaint",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    if (!complaint) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Loading Complaint Details</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Complaint Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Title and Status */}
                    <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{complaint.title}</h3>
                            <Badge className={getStatusColor(complaint.status)}>
                                {complaint.status}
                            </Badge>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Category: {getCategoryLabel(complaint.category)}</span>
                            <span>Filed: {new Date(complaint.createdAt).toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <Label className="text-sm font-semibold mb-2 block">Description</Label>
                        <p className="text-sm bg-muted p-3 rounded-md">{complaint.description}</p>
                    </div>

                    {/* Related Listing */}
                    {complaint.listing && (
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Related Listing</Label>
                            <Link
                                href={`/listings/${complaint.listing._id}`}
                                className="flex items-center gap-3 p-3 border rounded-md hover:bg-muted transition"
                            >
                                {complaint.listing.imageUrl && (
                                    <div className="relative h-16 w-16 rounded overflow-hidden flex-shrink-0">
                                        <Image
                                            src={complaint.listing.imageUrl}
                                            alt={complaint.listing.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{complaint.listing.title}</p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {complaint.listing.type} • {complaint.listing.locationName}
                                    </p>
                                </div>
                                <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            </Link>
                        </div>
                    )}

                    {/* Evidence */}
                    {complaint.evidenceUrls && complaint.evidenceUrls.length > 0 && (
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">
                                Evidence ({complaint.evidenceUrls.length})
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                                {complaint.evidenceUrls.map((evidence, idx) => (
                                    <a
                                        key={evidence.storageId}
                                        href={evidence.url || "#"}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative aspect-square rounded overflow-hidden border hover:opacity-80 transition"
                                    >
                                        <Image
                                            src={evidence.url || ""}
                                            alt={`Evidence ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Existing Admin Notes */}
                    {complaint.adminNotes && (
                        <div>
                            <Label className="text-sm font-semibold mb-2 block">Previous Admin Notes</Label>
                            <p className="text-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 rounded-md">
                                {complaint.adminNotes}
                            </p>
                        </div>
                    )}

                    {/* Admin Actions */}
                    <div className="border-t pt-4 space-y-4">
                        <div>
                            <Label htmlFor="status" className="text-sm font-semibold mb-2 block">
                                Update Status
                            </Label>
                            <select
                                id="status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                                <option value="open">Open</option>
                                <option value="in-review">In Review</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="adminNotes" className="text-sm font-semibold mb-2 block">
                                Admin Notes
                            </Label>
                            <Textarea
                                id="adminNotes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes about your review or actions taken..."
                                rows={4}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="flex-1"
                                variant="outline"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>Update Status</>
                                )}
                            </Button>
                            <Button
                                onClick={handleResolve}
                                disabled={isUpdating}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Resolving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Mark Resolved
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
