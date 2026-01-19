"use client";

import MyListings from "@/components/dashboard/MyListings";
import MatchSuggestions from "@/components/dashboard/MatchSuggestions";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const { user, isLoaded } = useUser();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-teal-500/30">
            {/* Glassmorphic Header */}


            <main className="container-tight py-8 space-y-8 px-4">
                {/* Welcome & Stats Section */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="col-span-full mb-4">
                        <h1 className="text-3xl font-display font-bold tracking-tight text-slate-900 dark:text-slate-50">
                            {isLoaded && user ? `Welcome back, ${user.firstName}!` : "Welcome to Rubix"}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">
                            Here's what's happening with your items today.
                        </p>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search your items..."
                                className="w-full pl-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-950 border-0 text-sm focus:ring-2 focus:ring-teal-500/50 outline-none transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/report-lost">
                            <Button className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20">
                                <PlusCircle className="mr-2 h-4 w-4" /> Report Lost
                            </Button>
                        </Link>
                        <Link href="/report-found">
                            <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-900/20">
                                <PlusCircle className="mr-2 h-4 w-4" /> Report Found
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Main Content (70%) */}
                    <div className="w-full lg:flex-1 min-w-0 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Your Listings</h2>
                            <Link href="/listings" className="text-sm text-teal-600 font-medium hover:underline">View All</Link>
                        </div>
                        <MyListings />
                    </div>

                    {/* Sidebar (30%) */}
                    <div className="w-full lg:w-[320px] space-y-6 sticky top-24">
                        <div className="p-1"> {/* Spacer/Padding fixer */}
                            <MatchSuggestions />
                        </div>

                        {/* Helpful tip card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-indigo-900/50 p-5 rounded-xl">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-200 text-sm mb-2 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white font-bold">?</span>
                                Pro Tip
                            </h3>
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed opacity-90">
                                Matches are suggested based on title, description, and location similarities. The more details you provide, the better the matches!
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}


