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
import { AlertCircle, ArrowLeft, FileUp, Loader2, Upload, ShieldAlert, PartyPopper, MessageSquare } from "lucide-react";
import { Id } from "../../../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

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
    const [showSuccess, setShowSuccess] = useState(false);

    const createComplaint = useMutation(api.complaints.createComplaint);
    const generateUploadUrl = useMutation(api.report.generateUploadUrl);
    const userListings = useQuery(api.getListing.getUserListings);

    const MAX_DESCRIPTION_LENGTH = 1000;
    const descriptionLength = description.length;

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

            // Show success animation
            setShowSuccess(true);
            setTimeout(() => {
                // Reset form
                setTitle("");
                setDescription("");
                setCategory("abuse");
                setSelectedListingId("");
                setEvidence([]);
                setShowSuccess(false);
                // Navigate back to dashboard
                router.push("/dashboard");
            }, 2500);
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
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans relative overflow-hidden">
            <div className="bg-red-500 h-2 w-full" />

            <div className="max-w-6xl mx-auto px-6 py-12">
                <a href="/dashboard">
                    <Button variant="ghost" className="mb-8 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-all font-bold uppercase text-xs tracking-widest group p-0 hover:bg-transparent dark:hover:bg-transparent">
                        <ArrowLeft
                            size={16}
                            className="mr-2 group-hover:-translate-x-1 transition-transform"
                        />
                        Back to Dashboard
                    </Button>
                </a>

                <div className="flex flex-col lg:flex-row gap-16 items-start">
                    {/* Left Column */}
                    <div className="lg:w-1/3 space-y-8">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-[2.5rem] flex items-center justify-center shadow-inner">
                            <ShieldAlert className="text-red-500 dark:text-red-400" size={32} />
                        </div>

                        <div>
                            <h1 className="text-5xl font-black leading-[1.1]">
                                Report a <span className="text-red-500">Complaint</span>
                            </h1>
                            <p className="text-xl text-slate-500 mt-6 leading-relaxed">
                                Help us maintain a safe and respectful community. Report any abuse, spam, or inappropriate content.
                            </p>
                        </div>

                        <div className="p-6 bg-slate-50/40 dark:bg-slate-900/30 rounded-3xl border border-slate-200/50 dark:border-slate-800/50 flex gap-4">
                            <AlertCircle className="text-red-500 shrink-0" size={24} />
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                <strong>Confidential:</strong> Your complaint will be reviewed by our moderation team. All reports are handled with care.
                            </p>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="lg:w-2/3 w-full relative">
                        {showSuccess && (
                            <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 z-30 flex flex-col items-center justify-center rounded-[3rem] animate-in fade-in zoom-in duration-500">
                                <div className="bg-green-100 dark:bg-green-900/40 p-6 rounded-full mb-4">
                                    <PartyPopper
                                        className="text-green-600 dark:text-green-300 animate-bounce"
                                        size={48}
                                    />
                                </div>
                                <h2 className="text-4xl font-black">Thank You!</h2>
                                <p className="text-slate-500 dark:text-slate-300 mt-2 font-medium">
                                    Your complaint has been submitted for review.
                                </p>
                            </div>
                        )}

                        <Card className={cn(
                            "border-2 border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-slate-950/40 shadow-red-900/10 transition-all duration-500 rounded-[3rem] overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm",
                            submitting && "blur-sm grayscale"
                        )}>
                            <CardContent className="p-8 md:p-12">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    {/* Title */}
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-xs font-black text-red-600 uppercase tracking-widest pl-1">
                                            Title <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="Brief summary of your complaint"
                                            required
                                            maxLength={100}
                                            className="h-14 text-lg bg-slate-50 border-slate-200 rounded-2xl px-4 focus-visible:ring-red-500"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-xs font-black text-red-600 uppercase tracking-widest pl-1">
                                            Category <span className="text-red-500">*</span>
                                        </Label>
                                        <select
                                            id="category"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as any)}
                                            className="w-full h-14 text-base bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="description" className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase pl-1">
                                                <MessageSquare size={14} className="text-red-500" />
                                                Description & Details <span className="text-red-500">*</span>
                                            </Label>
                                            <span className={`text-xs font-medium ${
                                                descriptionLength > MAX_DESCRIPTION_LENGTH
                                                    ? "text-red-600"
                                                    : descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9
                                                        ? "text-orange-600"
                                                        : "text-slate-400"
                                            }`}>
                                                {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                                            </span>
                                        </div>
                                        <Textarea
                                            id="description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Provide detailed information about your complaint..."
                                            required
                                            rows={6}
                                            maxLength={1000}
                                            className={`min-h-[120px] bg-slate-50 rounded-2xl p-4 focus-visible:ring-red-500 resize-none text-base ${
                                                descriptionLength > MAX_DESCRIPTION_LENGTH
                                                    ? "border-2 border-red-500"
                                                    : descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9
                                                        ? "border-2 border-orange-300"
                                                        : "border-slate-200"
                                            }`}
                                        />
                                    </div>

                                    {/* Related Listing (Optional) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="listing" className="text-xs font-black text-slate-400 uppercase pl-1">
                                            Related Listing (Optional)
                                        </Label>
                                        <select
                                            id="listing"
                                            value={selectedListingId}
                                            onChange={(e) => setSelectedListingId(e.target.value)}
                                            className="w-full h-14 text-base bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl px-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                                        >
                                            <option value="">None</option>
                                            {userListings?.map((listing) => (
                                                <option key={listing._id} value={listing._id}>
                                                    {listing.title} ({listing.type})
                                                </option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
                                            Select a listing if your complaint is related to a specific item
                                        </p>
                                    </div>

                            {/* Evidence Upload (Optional) */}
                            <div className="space-y-3">
                                <Label htmlFor="evidence" className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">
                                    Evidence (Optional)
                                </Label>
                                <div className="border-2 border-dashed border-slate-200 hover:border-red-400 dark:border-slate-700 dark:hover:border-red-600 rounded-3xl p-8 text-center transition-colors">
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
                                            <Loader2 className="h-10 w-10 text-red-500 animate-spin mb-2" />
                                        ) : (
                                            <div className="bg-white dark:bg-slate-800 p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                                <Upload className="text-red-500" size={32} />
                                            </div>
                                        )}
                                        <p className="text-sm font-bold text-slate-400">
                                            {uploading
                                                ? "Uploading..."
                                                : "Click to upload screenshots or evidence"}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            PNG, JPG up to 10MB each
                                        </p>
                                    </label>
                                </div>
                                {evidence.length > 0 && (
                                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2 pl-1">
                                        <FileUp className="h-4 w-4" />
                                        {evidence.length} file(s) uploaded
                                    </p>
                                )}
                            </div>

                                    {/* Info Alert */}
                                    <div className="flex gap-3 p-6 border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/30 rounded-3xl">
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
                                    <Button
                                        disabled={submitting || uploading}
                                        type="submit"
                                        className="w-full h-16 rounded-[2rem] text-xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-200 dark:shadow-slate-950/40 transition-all hover:-translate-y-1 hover:shadow-red-100 dark:hover:shadow-red-900/20"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                Submitting Complaint...
                                            </>
                                        ) : (
                                            <>
                                                Submit Complaint
                                                <ShieldAlert className="ml-2" size={24} />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
