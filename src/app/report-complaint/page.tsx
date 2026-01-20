"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, ArrowLeft, FileUp, Loader2, Upload } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";

export default function ReportComplaintPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<
        "abuse" | "spam" | "inappropriate_content" | "harassment" | "other"
    >("abuse");
    const [selectedListingId, setSelectedListingId] = useState<string>("");
    const [evidence, setEvidence] = useState<Id<"_storage">[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const createComplaint = useMutation(api.complaints.createComplaint);
    const generateUploadUrl = useMutation(api.report.generateUploadUrl);
    const userListings = useQuery(api.getListing.getUserListings);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const uploadedIds: Id<"_storage">[] = [];

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const uploadUrl = await generateUploadUrl();

                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": file.type },
                    body: file,
                });

                const { storageId } = await result.json();
                uploadedIds.push(storageId);
            }

            setEvidence([...evidence, ...uploadedIds]);
            toast.success("Files uploaded", {
                description: `${uploadedIds.length} file(s) uploaded successfully`,
            });
        } catch (error) {
            console.error("Upload error:", error);
            toast.error("Upload failed", {
                description: "Failed to upload files. Please try again.",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim()) {
            toast.error("Missing information", {
                description: "Please fill in all required fields",
            });
            return;
        }

        setSubmitting(true);
        try {
            await createComplaint({
                title: title.trim(),
                description: description.trim(),
                category,
                listingId: selectedListingId ? (selectedListingId as Id<"listings">) : undefined,
                evidence,
            });

            toast.success("Complaint submitted", {
                description: "Your complaint has been submitted successfully. Our team will review it soon.",
            });

            // Reset form
            setTitle("");
            setDescription("");
            setCategory("abuse");
            setSelectedListingId("");
            setEvidence([]);

            // Navigate back to dashboard after a short delay
            setTimeout(() => router.push("/dashboard"), 1500);
        } catch (error) {
            console.error("Submit error:", error);
            toast.error("Submission failed", {
                description: "Failed to submit complaint. Please try again.",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
            <div className="container max-w-3xl py-10 px-4">
                <Button
                    onClick={() => router.push("/dashboard")}
                    variant="ghost"
                    className="mb-8 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all font-bold uppercase text-xs tracking-widest group p-0 hover:bg-transparent dark:hover:bg-transparent"
                >
                    <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </Button>

                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-2">Report a Complaint</h1>
                    <p className="text-muted-foreground">
                        Help us maintain a safe and respectful community. Report any abuse, spam, or inappropriate content.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Complaint Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">
                                    Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Brief summary of your complaint"
                                    required
                                    maxLength={100}
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category">
                                    Category <span className="text-red-500">*</span>
                                </Label>
                                <select
                                    id="category"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as any)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    required
                                >
                                    <option value="abuse">Abuse</option>
                                    <option value="spam">Spam</option>
                                    <option value="inappropriate_content">Inappropriate Content</option>
                                    <option value="harassment">Harassment</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Description <span className="text-red-500">*</span>
                                </Label>
                                <Textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Provide detailed information about your complaint..."
                                    required
                                    rows={6}
                                    maxLength={1000}
                                />
                                <p className="text-xs text-muted-foreground">
                                    {description.length}/1000 characters
                                </p>
                            </div>

                            {/* Related Listing (Optional) */}
                            <div className="space-y-2">
                                <Label htmlFor="listing">
                                    Related Listing (Optional)
                                </Label>
                                <select
                                    id="listing"
                                    value={selectedListingId}
                                    onChange={(e) => setSelectedListingId(e.target.value)}
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <option value="">None</option>
                                    {userListings?.map((listing) => (
                                        <option key={listing._id} value={listing._id}>
                                            {listing.title} ({listing.type})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Select a listing if your complaint is related to a specific item
                                </p>
                            </div>

                            {/* Evidence Upload (Optional) */}
                            <div className="space-y-2">
                                <Label htmlFor="evidence">
                                    Evidence (Optional)
                                </Label>
                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 text-center">
                                    <input
                                        id="evidence"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        disabled={uploading}
                                    />
                                    <label
                                        htmlFor="evidence"
                                        className={`cursor-pointer flex flex-col items-center ${uploading ? "opacity-50" : ""
                                            }`}
                                    >
                                        {uploading ? (
                                            <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
                                        ) : (
                                            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                        )}
                                        <p className="text-sm text-muted-foreground">
                                            {uploading
                                                ? "Uploading..."
                                                : "Click to upload screenshots or evidence"}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PNG, JPG up to 10MB each
                                        </p>
                                    </label>
                                </div>
                                {evidence.length > 0 && (
                                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                        <FileUp className="h-4 w-4" />
                                        {evidence.length} file(s) uploaded
                                    </p>
                                )}
                            </div>

                            {/* Info Alert */}
                            <div className="flex gap-3 p-4 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-900 dark:text-blue-200">
                                    <p className="font-semibold mb-1">Your complaint will be reviewed</p>
                                    <p className="text-blue-700 dark:text-blue-300">
                                        Our moderation team will review your complaint and take appropriate action.
                                        You can track the status in your dashboard.
                                    </p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/dashboard")}
                                    disabled={submitting}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submitting || uploading}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Complaint"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
