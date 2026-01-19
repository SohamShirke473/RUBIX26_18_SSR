"use client";

import Footer from "@/components/Footer";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { PackageSearch, PackageCheck, Clock, MapPin, TrendingUp, ArrowRight } from "lucide-react";

const lostItems = [
  {
    id: 1,
    title: "Black Leather Wallet",
    location: "Central Park",
    date: "2 hours ago",
  },
];

const foundItems = [
  {
    id: 2,
    title: "iPhone 15 Pro",
    location: "Coffee Shop",
    date: "4 hours ago",
    similarCount: 3, // TODO: Replace with similarity detection logic
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">

      <main className="container max-w-7xl flex-1 py-8 space-y-8 px-4 sm:px-6">

        {/* HERO */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium text-white">
              <TrendingUp className="h-3 w-3" />
              Active Dashboard
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Your Lost & Found Hub
            </h1>
            <p className="text-white/90 text-lg max-w-2xl">
              Track your reported items and discover potential matches with our smart detection system.
            </p>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-xl p-5 bg-card hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Lost Items</p>
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
                <p className="text-sm text-muted-foreground font-medium">Total Found Items</p>
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
                <p className="text-sm text-muted-foreground font-medium">Potential Matches</p>
                <p className="text-3xl font-bold mt-1">
                  {foundItems.reduce((acc, item) => acc + item.similarCount, 0)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </div>
        </div>

        {/* LOST SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <PackageSearch className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Lost Items</h2>
                <p className="text-sm text-muted-foreground">
                  Items you've reported as missing
                </p>
              </div>
            </div>
            <button className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {lostItems.map((item) => (
              <div
                key={item.id}
                className="group relative border rounded-xl p-5 bg-card hover:shadow-lg hover:border-destructive/30 transition-all cursor-pointer"
              >
                <div className="absolute top-4 right-4">
                  <Badge variant="destructive" className="shadow-sm">Lost</Badge>
                </div>
                
                <div className="space-y-4 mt-2">
                  <div className="pr-16">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="space-y-2">
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
            ))}
          </div>
        </div>

        {/* FOUND SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <PackageCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Found Items</h2>
                <p className="text-sm text-muted-foreground">
                  Items you've discovered and reported
                </p>
              </div>
            </div>
            <button className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {foundItems.map((item) => (
              <div
                key={item.id}
                className="group relative border rounded-xl p-5 bg-card hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <Badge className="shadow-sm">Found</Badge>
                  {item.similarCount > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-orange-500/10 border border-orange-500/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-xs font-semibold text-orange-600">
                        {item.similarCount} Match{item.similarCount !== 1 ? 'es' : ''}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>{item.date}</span>
                    </div>
                  </div>

                  {/* TODO: Replace similarity count with algorithm */}
                </div>
              </div>
            ))}
          </div>
        </div>
        
      </main>
      <Footer />
    </div>
  );
}