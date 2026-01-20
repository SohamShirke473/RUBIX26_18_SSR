"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

// Fix for default marker icon in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Only render map on client side
    if (!isClient) {
        return (
            <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{locationName}</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">{locationName}</span>
            </div>

            <div className="rounded-xl overflow-hidden border-2 border-slate-200">
                <MapContainer
                    center={[latitude, longitude]}
                    zoom={15}
                    style={{ height: "300px", width: "100%" }}
                    dragging={false}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    doubleClickZoom={false}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[latitude, longitude]} />
                </MapContainer>
            </div>
        </div>
    );
}
