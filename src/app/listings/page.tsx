"use client"

import Link from "next/link";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { MapPin, Clock, PackageSearch, PackageCheck, TrendingUp } from "lucide-react";

const items = [
  { id: 1, type: "lost", title: "Black Leather Wallet", category: "Wallet", location: "Central Park", date: "2 hours ago", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop" },
  { id: 2, type: "found", title: "iPhone 15 Pro", category: "Electronics", location: "Coffee Shop", date: "4 hours ago", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop", similarCount: 3 },
  { id: 3, type: "lost", title: "Golden Retriever - Max", category: "Pets", location: "Riverside", date: "1 day ago", image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop" },
  { id: 4, type: "found", title: "Car Keys", category: "Keys", location: "Station", date: "3 hours ago", image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=300&fit=crop", similarCount: 1 },
];

export default function ListingsPage() {
  const lostItems = items.filter(item => item.type === "lost");
  const foundItems = items.filter(item => item.type === "found");

  return (
    <div className="min-h-screen bg-background">

      <main className="container max-w-7xl py-8 space-y-8 px-4 sm:px-6">

        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium text-white">
              <TrendingUp className="h-3 w-3" />
              Live Updates
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Recent Lost & Found Items
            </h1>
            <p className="text-white/90 text-lg max-w-2xl">
              Browse the latest reports from the community and help reunite items with their owners.
            </p>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Lost Items</p>
                <p className="text-3xl font-bold mt-1">{lostItems.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <PackageSearch className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Found Items</p>
                <p className="text-3xl font-bold mt-1">{foundItems.length}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <PackageCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Active Matches</p>
                <p className="text-3xl font-bold mt-1">
                  {foundItems.reduce((acc, item) => acc + (item.similarCount || 0), 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* ALL ITEMS GRID */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <PackageCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">All Listings</h2>
              <p className="text-sm text-muted-foreground">
                Browse through all reported items
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map((item) => (
              <Link key={item.id} href={`/listings/${item.id}`}>
                <div className="group relative border rounded-xl overflow-hidden bg-card hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge 
                        variant={item.type === "lost" ? "destructive" : "default"}
                        className="shadow-sm"
                      >
                        {item.type === "lost" ? "Lost" : "Found"}
                      </Badge>
                      {item.type === "found" && item.similarCount && item.similarCount > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/20">
                          <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                          <span className="text-xs font-semibold text-orange-600">
                            {item.similarCount} Match{item.similarCount !== 1 ? 'es' : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">{item.category}</p>
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{item.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
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