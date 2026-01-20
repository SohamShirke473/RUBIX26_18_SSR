"use client";

import React from "react";
import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the map component with SSR disabled
const LocationMap = dynamic(() => import("./LocationMap"), {
    ssr: false,
    loading: () => (
        <div className="h-[300px] w-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center text-slate-400">
            Loading Map...
        </div>
    ),
});

interface LocationDisplayProps {
    latitude: number;
    longitude: number;
    locationName: string;
}

export default function LocationDisplay({
    latitude,
    longitude,
    locationName,
}: LocationDisplayProps) {
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{locationName}</span>
            </div>

            <div className="rounded-xl overflow-hidden border-2 border-slate-200">
                <LocationMap latitude={latitude} longitude={longitude} />
            </div>
        </div>
    );
}
