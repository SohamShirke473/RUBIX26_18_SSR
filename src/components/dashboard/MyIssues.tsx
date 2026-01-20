"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MyIssues() {
    const issues = useQuery(api.issues.getMyIssues);

    if (issues === undefined) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (issues.length === 0) {
        return null; // Don't show if no issues
    }

    return (
        <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-900/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        My Support Tickets
                    </CardTitle>
                    <Link href="/support">
                        <Button variant="ghost" size="sm" className="h-8 text-xs">
                            New Ticket
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {issues.map((issue) => (
                        <div key={issue._id} className="bg-white dark:bg-slate-900 rounded-lg p-3 border shadow-sm text-sm">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-semibold">{issue.title}</span>
                                <Badge variant={issue.status === "solved" ? "default" : "secondary"} className="text-[10px] h-5">
                                    {issue.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground line-clamp-2 text-xs mb-2">
                                {issue.description}
                            </p>
                            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                                <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                                {issue.adminResponse && (
                                    <span className="text-green-600 dark:text-green-400 font-medium">
                                        Response: {issue.adminResponse}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
