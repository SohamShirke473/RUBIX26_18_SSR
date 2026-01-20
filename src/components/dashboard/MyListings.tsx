"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { ItemCard } from "@/components/ItemCard";
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
                <div className="flex p-1 bg-muted dark:bg-slate-800 rounded-lg border dark:border-slate-700">
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
                <div className="text-center py-12 border-2 border-dashed dark:border-slate-700 rounded-xl">
                    <p className="text-muted-foreground dark:text-slate-400">No {activeTab} items reported yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map((item) => (
                        <ItemCard
                            key={item._id}
                            id={item._id}
                            type={item.type}
                            title={item.title}
                            category={item.categories[0]}
                            location={item.locationName}
                            date={item.createdAt}
                            imageUrl={item.imageUrl || undefined}
                            status={item.status}
                            showStatus={true}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
