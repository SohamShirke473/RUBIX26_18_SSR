"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

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

const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
        open: "Open",
        "in-review": "In Review",
        resolved: "Resolved",
        closed: "Closed",
    };
    return labels[status] || status;
};

export default function UserComplaints() {
    const complaints = useQuery(api.complaints.getUserComplaints);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    if (complaints === undefined) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        My Complaints
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (complaints.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        My Complaints
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>You haven't submitted any complaints yet.</p>
                        <p className="text-sm mt-1">
                            If you encounter any issues, you can report them using the button above.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    My Complaints
                    <Badge variant="secondary" className="ml-auto">
                        {complaints.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {complaints.map((complaint) => (
                        <div
                            key={complaint._id}
                            className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-sm truncate">
                                            {complaint.title}
                                        </h3>
                                        <Badge className={getStatusColor(complaint.status)}>
                                            {getStatusLabel(complaint.status)}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                                        <span className="flex items-center gap-1">
                                            <span className="font-medium">Category:</span>
                                            {getCategoryLabel(complaint.category)}
                                        </span>
                                        <span>
                                            {new Date(complaint.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {complaint.listing && (
                                        <Link
                                            href={`/listings/${complaint.listing._id}`}
                                            className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                                        >
                                            <FileText className="h-3 w-3" />
                                            Related to: {complaint.listing.title}
                                        </Link>
                                    )}

                                    {expandedId === complaint._id && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                                                {complaint.description}
                                            </p>

                                            {complaint.adminNotes && (
                                                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded p-3">
                                                    <div className="flex items-start gap-2">
                                                        <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                        <div className="flex-1">
                                                            <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">
                                                                Admin Response
                                                            </p>
                                                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                                                {complaint.adminNotes}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() =>
                                        setExpandedId(
                                            expandedId === complaint._id ? null : complaint._id
                                        )
                                    }
                                    className="text-xs text-teal-600 dark:text-teal-400 hover:underline flex-shrink-0"
                                >
                                    {expandedId === complaint._id ? "Hide" : "Details"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
