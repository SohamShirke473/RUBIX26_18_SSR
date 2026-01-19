"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, MapPin, Calendar, Tag, Sparkles, Check, X, ArrowLeft, Send, Edit2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ListingChat from "@/components/ListingChat";
import VerificationModal from "@/components/verification/VerificationModal";

export default function ListingDetailPage() {
    const params = useParams<{ id: string }>();
    const listingId = params.id as Id<"listings">;
    const { user, isLoaded } = useUser();

    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    const listing = useQuery(api.getListing.getListingById, { id: listingId });
    const matches = useQuery(api.matchingHelpers.getMatchesForListing, { listingId });

    const confirmMatch = useMutation(api.matchingHelpers.confirmMatch);
    const rejectMatch = useMutation(api.matchingHelpers.rejectMatch);

    // Check if current user is the owner
    const isOwner = isLoaded && user && listing && listing.clerkUserId === user.id;

    // Loading state
    if (listing === undefined) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not found state
    if (listing === null) {
        return (
            <div className="container max-w-7xl py-20 px-4 sm:px-6">
                <div className="border-2 border-destructive/50 dark:border-destructive/60 bg-destructive/10 dark:bg-destructive/20 rounded-xl p-8 text-center">
                    <p className="text-destructive dark:text-red-400 font-semibold text-lg">Listing not found</p>
                </div>
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
        <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col items-center justify-center">
            <div className="container max-w-7xl py-8 space-y-6 px-4 sm:px-6">
                {/* Back Button */}
                <Link href="/listings">
                    <Button variant="ghost" className="mb-8 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all font-bold uppercase text-xs tracking-widest group p-0 hover:bg-transparent dark:hover:bg-transparent">
                        <ArrowLeft
                            size={16}
                            className="mr-2 group-hover:-translate-x-1 transition-transform"
                        />
                        Back to Listings
                    </Button>
                </Link>

                {/* Main Content Grid */}
                <div className="grid lg:grid-cols-[400px_1fr] gap-6">
                    {/* Left: Image */}
                    <div className="space-y-4">
                        {listing.imageUrls && listing.imageUrls.length > 0 ? (
                            <div
                                className="relative w-full aspect-square rounded-2xl overflow-hidden border-2 bg-muted cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => setExpandedImage(listing.imageUrls![0])}
                            >
                                <Image
                                    src={listing.imageUrls[0]}
                                    alt={listing.title}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        ) : (
                            <div className="relative w-full aspect-square rounded-2xl border-2 border-dashed bg-muted flex items-center justify-center">
                                <Tag className="h-16 w-16 text-muted-foreground" />
                            </div>
                        )}
                    </div>

                    {/* Right: Details */}
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-0 flex-1">
                                            {listing.title}
                                        </h1>
                                        {isOwner && (
                                            <Link href={`/listings/${listingId}/edit`}>
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                                                    title="Edit listing"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>

                                    {!isOwner && listing.type === "found" && ( // Only show on found items if not owner
                                        <div className="mb-4">
                                            <VerificationModal listingId={listingId} listingTitle={listing.title} />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                            variant={listing.type === "lost" ? "destructive" : "default"}
                                            className="text-sm px-3 py-1"
                                        >
                                            {listing.type.toUpperCase()}
                                        </Badge>
                                        <Badge
                                            variant={
                                                listing.status === "open"
                                                    ? "outline"
                                                    : listing.status === "matched"
                                                        ? "secondary"
                                                        : "default"
                                            }
                                            className="text-sm px-3 py-1"
                                        >
                                            {listing.status.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">Description</h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {listing.description}
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <h3 className="font-semibold text-lg">Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="text-muted-foreground">{listing.locationName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
                                        <span className="text-muted-foreground">{formattedDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap text-sm col-span-full">
                                        <Tag className="h-4 w-4 text-primary flex-shrink-0" />
                                        {listing.categories.map((cat) => (
                                            <Badge key={cat} variant="outline" className="capitalize">
                                                {cat.replace("_", " ")}
                                            </Badge>
                                        ))}
                                    </div>
                                    {listing.color && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Color: </span>
                                            <span className="font-medium capitalize">{listing.color}</span>
                                        </div>
                                    )}
                                    {listing.brand && (
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Brand: </span>
                                            <span className="font-medium">{listing.brand}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Potential Matches */}
                            {matches !== undefined && matches.length > 0 && (
                                <>
                                    <Separator />
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="h-5 w-5 text-orange-500" />
                                            <h3 className="font-semibold text-lg">Potential Matches</h3>
                                            <Badge variant="secondary" className="ml-auto">
                                                {matches.length}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            {matches.slice(0, 3).map((match) => (
                                                <div
                                                    key={match._id}
                                                    className="flex items-center gap-3 p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                                                >
                                                    {match.matchedListing?.imageUrl ? (
                                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                                                            <Image
                                                                src={match.matchedListing.imageUrl}
                                                                alt={match.matchedListing.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                                            <Tag className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                    )}

                                                    <div className="flex-1 min-w-0">
                                                        <Link
                                                            href={`/listings/${match.matchedListing?._id}`}
                                                            className="font-medium hover:text-primary transition-colors truncate block text-sm"
                                                        >
                                                            {match.matchedListing?.title || "Unknown item"}
                                                        </Link>
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

                                                    {match.status === "suggested" && (
                                                        <div className="flex gap-1.5 flex-shrink-0">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 border-green-200 hover:bg-green-50 hover:text-green-700"
                                                                onClick={() => handleConfirmMatch(match._id)}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-8 w-8 p-0 border-red-200 hover:bg-red-50 hover:text-red-700"
                                                                onClick={() => handleRejectMatch(match._id)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {matches.length > 3 && (
                                            <Button variant="outline" className="w-full" size="sm">
                                                View All {matches.length} Matches
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Chat Section */}
                <ListingChat listingId={listingId} />

                {/* Lightbox Overlay */}
                {expandedImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-200"
                        onClick={() => setExpandedImage(null)}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 text-white hover:text-gray-300 hover:bg-white/10"
                            onClick={() => setExpandedImage(null)}
                        >
                            <X className="h-8 w-8" />
                            <span className="sr-only">Close</span>
                        </Button>
                        <div
                            className="relative w-full max-w-5xl h-full flex items-center justify-center p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="relative w-full h-full">
                                <Image
                                    src={expandedImage}
                                    alt="Expanded view"
                                    fill
                                    className="object-contain"
                                    quality={100}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}