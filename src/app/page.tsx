"use client";

import MyListings from "@/components/dashboard/MyListings";
import MatchSuggestions from "@/components/dashboard/MatchSuggestions";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";

export default function Home() {
  const { user, isLoaded } = useUser();

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden">
      <div className="bg-teal-500 h-2 w-full" />
      <main className="container-tight py-10 mt-4 p-4 ">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900">
              {isLoaded && user ? `Welcome back, ${user.firstName}!` : "Welcome to Rubix"}
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your items and see potential matches.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/listings"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-input bg-background/50 hover:bg-muted font-medium rounded-lg transition-colors text-sm"
            >
              <Search className="h-4 w-4" />
              Browse All
            </Link>
            <Link
              href="/report-lost"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 font-medium rounded-lg transition-colors shadow-sm text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Report Lost
            </Link>
            <Link
              href="/report-found"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-lg transition-colors shadow-sm text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              Report Found
            </Link>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content (70%) */}
          <div className="flex-1 min-w-0">
            <MyListings />
          </div>

          {/* Sidebar (30%) */}
          <div className="lg:w-[350px] space-y-8">
            <MatchSuggestions />

            {/* Helpful tip card */}
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl">
              <h3 className="font-semibold text-blue-900 text-sm mb-1">Tip</h3>
              <p className="text-xs text-blue-700 leading-relaxed">
                Matches are suggested based on title, description, and location similarities. The more details you provide, the better the matches!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}