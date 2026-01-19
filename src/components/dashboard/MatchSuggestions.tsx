"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";

export default function MatchSuggestions() {
    const { user } = useUser();

    const matches = useQuery(api.matches.getMatchesForUser, {
        clerkUserId: user?.id || "",
    });

    if (!user) return null;

    if (matches === undefined) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Potential Matches</h2>
                <div className="h-24 bg-muted rounded-xl animate-pulse" />
                <div className="h-24 bg-muted rounded-xl animate-pulse" />
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Potential Matches</h2>
                <div className="p-6 bg-muted/50 rounded-xl text-center text-sm text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    No matches found yet. We&apos;ll notify you when we spot something!
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Potential Matches</h2>
                <Badge variant="secondary" className="bg-teal-100 text-teal-700 hover:bg-teal-100">
                    {matches.length} New
                </Badge>
            </div>

            <div className="grid gap-4">
                {matches.map(({ matchId, score, myListing, matchedListing }) => (
                    <Link key={matchId} href={`/listings/${matchedListing._id}`}>
                        <Card className="hover:shadow-md transition-all cursor-pointer border-teal-100/50 hover:border-teal-200 bg-linear-to-r from-teal-50/30 to-transparent">
                            <CardContent className="p-3">
                                <div className="flex gap-3">
                                    {/* Image */}
                                    <div className="relative h-20 w-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                                        {matchedListing.imageUrl ? (
                                            <Image
                                                src={matchedListing.imageUrl}
                                                alt={matchedListing.title}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-muted">
                                                No Img
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col flex-1 min-w-0 justify-between">
                                        <div>
                                            <div className="flex justify-between items-start gap-1">
                                                <h3 className="font-semibold text-sm line-clamp-1">{matchedListing.title}</h3>
                                                <span className="text-xs font-bold text-teal-600 shrink-0">
                                                    {Math.round(score * 100)}% Match
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                                Matches your &quot;{myListing.title}&quot;
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-2">
                                            <Badge variant="outline" className="text-[10px] px-1.5 h-5 bg-white">
                                                {matchedListing.type}
                                            </Badge>
                                            <div className="flex items-center text-xs text-primary font-medium group">
                                                View
                                                <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
