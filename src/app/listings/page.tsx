"use client"

import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { MapPin, Clock } from "lucide-react";

import { usePaginatedQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { X, Search } from "lucide-react";


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
    <div className="min-h-screen bg-background px-4">
      <main className="py-10">
        <div className="container-tight">
          <h1 className="text-4xl font-display font-bold mb-8">
            Recent Lost & Found Items
          </h1>
          <div className="flex flex-col lg:flex-row gap-4 mb-8 items-start lg:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items by title or description..."
                className="pl-10 h-10 w-full rounded-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto items-start sm:items-center">
              {/* Type Filter */}
              <div className="flex items-center p-1 bg-muted rounded-lg border border-border">
                {(["all", "lost", "found"] as FilterType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={cn(
                      "px-4 py-1.5 rounded-md text-sm font-medium transition capitalize",
                      filterType === type
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Category Filter - Dropdown */}
              <Select
                value={selectedCategory || "all"}
                onValueChange={(val) => setSelectedCategory(val === "all" ? null : (val as ItemCategoryType))}
              >
                <SelectTrigger className="w-[180px] capitalize">
                  <SelectValue placeholder="Category" />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results?.map((item) => (
              <Link key={item._id} href={`/listings/${item._id}`} className="group">
                <Card className="overflow-hidden rounded-2xl border border-border hover:shadow-md transition h-full flex flex-col">
                  <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        className="object-cover group-hover:scale-105 transition"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
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
                    </div>

                    <p className="text-xs text-muted-foreground capitalize">{item.categorys[0]}</p>
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
