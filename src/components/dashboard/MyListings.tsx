"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MyListings() {
    const { user } = useUser();
    const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");

    const listings = useQuery(api.getListing.getListingByUser, {
        clerkUserId: user?.id || "",
    });

    if (!user) return null;

    const filteredListings = listings?.filter(l => l.type === activeTab) || [];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">My Items</h2>
                <div className="flex p-1 bg-muted rounded-lg">
                    <button
                        onClick={() => setActiveTab("lost")}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === "lost"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Reported Lost
                    </button>
                    <button
                        onClick={() => setActiveTab("found")}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === "found"
                                ? "bg-background shadow-sm text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Reported Found
                    </button>
                </div>
            </div>

            {!listings ? (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredListings.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                    <p className="text-muted-foreground">No {activeTab} items reported yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((item) => (
                        <Link key={item._id} href={`/listings/${item._id}`} className="group">
                            <Card className="overflow-hidden rounded-2xl border border-border hover:shadow-md transition h-full flex flex-col">
                                <div className="aspect-4/3 overflow-hidden bg-muted relative">
                                    {item.imageUrl ? (
                                        <Image
                                            src={item.imageUrl}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                            No Image
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-4 flex flex-col flex-1">
                                    <div className="flex gap-2 mb-2">
                                        <Badge variant={item.type === "lost" ? "destructive" : "default"} >
                                            {item.type}
                                        </Badge>
                                        <Badge variant="outline" className={cn(
                                            item.status === "open" ? "text-green-600 border-green-200" :
                                                item.status === "matched" ? "text-blue-600 border-blue-200" :
                                                    "text-gray-600 border-gray-200"
                                        )}>
                                            {item.status}
                                        </Badge>
                                    </div>

                                    <p className="text-xs text-muted-foreground capitalize">{item.categories[0]}</p>
                                    <h3 className="font-semibold text-sm mb-3 line-clamp-1">{item.title}</h3>

                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-auto">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span className="line-clamp-1">{item.locationName}</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
