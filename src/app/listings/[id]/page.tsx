"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, MapPin, Calendar, Tag, Sparkles, Check, X } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ListingDetailPage() {
    const params = useParams<{ id: string }>();
    const listingId = params.id as Id<"listings">;

    const listing = useQuery(api.getListing.getListingById, { id: listingId });
    const matches = useQuery(api.matchingHelpers.getMatchesForListing, { listingId });

    const confirmMatch = useMutation(api.matchingHelpers.confirmMatch);
    const rejectMatch = useMutation(api.matchingHelpers.rejectMatch);

    // Loading state
    if (listing === undefined) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Not found state
    if (listing === null) {
        return (
            <div className="container py-20">
                <Card className="border-destructive bg-destructive/10">
                    <CardContent className="p-6 text-destructive font-medium">
                        Listing not found
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formattedDate = new Date(listing.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    const handleConfirmMatch = async (matchId: Id<"matches">) => {
        await confirmMatch({ matchId });
    };

    const handleRejectMatch = async (matchId: Id<"matches">) => {
        await rejectMatch({ matchId });
    };

    return (
        <div className="container max-w-5xl py-10 space-y-8">
            <Card>
                <CardContent className="p-6 space-y-6">
                    {/* Title + Status */}
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold">{listing.title}</h1>
                        <Badge variant={listing.type === "lost" ? "destructive" : "default"}>
                            {listing.type.toUpperCase()}
                        </Badge>
                    </div>

                    {/* Images */}
                    {listing.imageUrls && listing.imageUrls.length > 0 && (
                        <div className="relative w-full h-[350px] rounded-lg overflow-hidden bg-muted">
                            <Image
                                src={listing.imageUrls[0]}
                                alt={listing.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}

                    {/* Description */}
                    <p className="text-muted-foreground leading-relaxed">
                        {listing.description}
                    </p>

                    <Separator />

                    {/* Meta Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} /> {listing.locationName}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar size={16} /> {formattedDate}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Tag size={16} />
                            {listing.categories.map((cat) => (
                                <Badge key={cat} variant="outline" className="capitalize">
                                    {cat.replace("_", " ")}
                                </Badge>
                            ))}
                        </div>
                        {listing.color && (
                            <div className="flex items-center gap-2">
                                Color: <span className="capitalize">{listing.color}</span>
                            </div>
                        )}
                        {listing.brand && (
                            <div className="flex items-center gap-2">
                                Brand: <span className="font-medium">{listing.brand}</span>
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Status:</span>
                        <Badge
                            variant={
                                listing.status === "open"
                                    ? "outline"
                                    : listing.status === "matched"
                                        ? "secondary"
                                        : "default"
                            }
                        >
                            {listing.status.toUpperCase()}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Potential Matches Section */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500" />
                        <h2 className="font-semibold text-lg">Potential Matches</h2>
                    </div>

                    {matches === undefined ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No matches found yet. Matches will appear here when similar{" "}
                            {listing.type === "lost" ? "found" : "lost"} items are reported.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {matches.map((match) => (
                                <div
                                    key={match._id}
                                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    {/* Match Image */}
                                    {match.matchedListing?.imageUrl ? (
                                        <div className="relative w-20 h-20 rounded-md overflow-hidden flex-shrink-0">
                                            <Image
                                                src={match.matchedListing.imageUrl}
                                                alt={match.matchedListing.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                            <Tag className="h-6 w-6 text-muted-foreground" />
                                        </div>
                                    )}

                                    {/* Match Details */}
                                    <div className="flex-1 min-w-0">
                                        <Link
                                            href={`/listings/${match.matchedListing?._id}`}
                                            className="font-medium hover:underline truncate block"
                                        >
                                            {match.matchedListing?.title || "Unknown item"}
                                        </Link>
                                        <p className="text-sm text-muted-foreground truncate">
                                            {match.matchedListing?.locationName}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline" className="text-xs">
                                                {Math.round(match.score * 100)}% match
                                            </Badge>
                                            <Badge
                                                variant={
                                                    match.status === "suggested"
                                                        ? "secondary"
                                                        : match.status === "confirmed"
                                                            ? "default"
                                                            : "destructive"
                                                }
                                                className="text-xs"
                                            >
                                                {match.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {match.status === "suggested" && (
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                                onClick={() => handleConfirmMatch(match._id)}
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleRejectMatch(match._id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Chat UI Placeholder */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <h2 className="font-semibold text-lg">Contact about this item</h2>

                    <div className="border rounded-lg h-64 bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
                        Chat messages will appear here
                    </div>

                    <div className="flex gap-2">
                        <Input placeholder="Type your message..." />
                        <Button>Send</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}