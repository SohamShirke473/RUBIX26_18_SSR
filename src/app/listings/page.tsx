"use client"

import { ItemCard } from "@/components/ItemCard";

import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X, Search, Filter } from "lucide-react";


export default function ListingsPage() {
  type FilterType = "all" | "lost" | "found";
  type ItemCategoryType = "wallet" | "phone" | "keys" | "bag" | "documents" | "electronics" | "jewelry" | "clothing" | "id_card" | "cash" | "other";

  const [filterType, setFilterType] = useState<FilterType>("all");
  const [selectedCategory, setSelectedCategory] = useState<ItemCategoryType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { results, status, loadMore } = usePaginatedQuery(
    searchQuery
      ? api.getListing.searchListings
      : api.getListing.getAllListings,
    {
      search: searchQuery || "", // pass empty string if null, though logic handles it
      filterType: filterType === "all" ? undefined : filterType,
      filterCategory: selectedCategory ? [selectedCategory] : undefined
    },
    { initialNumItems: 10 }
  );

  const categories: ItemCategoryType[] = [
    "wallet", "phone", "keys", "bag", "documents", "electronics",
    "jewelry", "clothing", "id_card", "cash", "other"
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <div className="bg-teal-500 h-2 w-full" />
      <main className="py-10 px-4">
        <div className="container-tight">
          <h1 className="text-4xl font-display font-bold mb-8">
            Recent Lost & Found Items
          </h1>

          <div className="mb-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/70 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-slate-900 dark:to-slate-950 shadow-sm">
            <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search items by title or description..."
                  className="pl-10 h-10 w-full rounded-lg bg-white/80 dark:bg-slate-900/70"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                <button
                  onClick={() => setFilterType("all")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg border transition",
                    filterType === "all"
                      ? "bg-white text-foreground shadow-sm border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                      : "bg-white/70 text-muted-foreground hover:text-foreground border-slate-200 dark:bg-slate-900/70 dark:text-slate-400 dark:border-slate-800"
                  )}
                >
                  All items
                </button>
                <button
                  onClick={() => setFilterType("lost")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg border transition",
                    filterType === "lost"
                      ? "bg-white text-foreground shadow-sm border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                      : "bg-white/70 text-muted-foreground hover:text-foreground border-slate-200 dark:bg-slate-900/70 dark:text-slate-400 dark:border-slate-800"
                  )}
                >
                  Lost
                </button>
                <button
                  onClick={() => setFilterType("found")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg border transition",
                    filterType === "found"
                      ? "bg-white text-foreground shadow-sm border-slate-200 dark:bg-slate-900 dark:text-slate-50 dark:border-slate-700"
                      : "bg-white/70 text-muted-foreground hover:text-foreground border-slate-200 dark:bg-slate-900/70 dark:text-slate-400 dark:border-slate-800"
                  )}
                >
                  Found
                </button>

                <Select
                  value={selectedCategory || "all"}
                  onValueChange={(val) => setSelectedCategory(val === "all" ? null : (val as ItemCategoryType))}
                >
                  <SelectTrigger className="relative w-[180px] pl-10 bg-white/80 dark:bg-slate-900/70">
                    <Filter className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results?.map((item) => (
              <ItemCard
                key={item._id}
                id={item._id}
                type={item.type}
                title={item.title}
                category={item.categories[0]}
                location={item.locationName}
                date={item.createdAt}
                imageUrl={item.imageUrl || undefined}
              />
            ))}
          </div>

          {status === "CanLoadMore" && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={() => loadMore(10)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
              >
                Load More
              </button>
            </div>
          )}

          {status === "LoadingFirstPage" && (
            <div className="flex justify-center mt-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          {status === "Exhausted" && results.length === 0 && (
            <div className="flex justify-center mt-10 text-muted-foreground">
              No listings found.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}