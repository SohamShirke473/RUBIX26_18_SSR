"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
    const { user } = useUser();
    const reportIssue = useMutation(api.issues.reportIssue);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        setIsSubmitting(true);
        try {
            await reportIssue({
                title,
                description,
            });
            setIsSuccess(true);
            setTitle("");
            setDescription("");
        } catch (error) {
            console.error(error);
            alert("Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-6">
                    <div className="flex justify-center mb-4">
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl mb-2">Report Submitted</CardTitle>
                    <CardDescription className="mb-6">
                        Thank you for your feedback. We will review your issue shortly.
                    </CardDescription>
                    <div className="flex flex-col gap-2">
                        <Button onClick={() => setIsSuccess(false)} variant="outline">
                            Submit Another Issue
                        </Button>
                        <Link href="/dashboard">
                            <Button className="w-full">Return to Dashboard</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 selection:bg-teal-500/30">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <Link href="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <span>Support</span>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Support & Feedback</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Encountered an issue or have a suggestion? Let us know.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Raise an Issue</CardTitle>
                        <CardDescription>
                            Please describe the issue in detail so we can help you better.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!user ? (
                            <div className="text-center py-8">
                                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                                <p className="mb-4">You need to be signed in to report an issue.</p>
                                <Link href="/sign-in">
                                    <Button>Sign In</Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="title" className="text-sm font-medium">
                                        Title
                                    </label>
                                    <Input
                                        id="title"
                                        placeholder="Brief summary of the issue"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium">
                                        Description
                                    </label>
                                    <Textarea
                                        id="description"
                                        placeholder="Explain what happened..."
                                        className="min-h-[150px]"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? "Submitting..." : "Submit Report"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
