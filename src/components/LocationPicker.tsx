"use client";

import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Fix for default marker icon in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface LocationPickerProps {
    locationName: string;
    latitude?: number;
    longitude?: number;
    onLocationChange: (data: {
        locationName: string;
        latitude: number;
        longitude: number;
    }) => void;
}

// Component to handle map clicks
function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click: (e: L.LeafletMouseEvent) => {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

export default function LocationPicker({
    locationName,
    latitude,
    longitude,
    onLocationChange,
}: LocationPickerProps) {
    const [position, setPosition] = useState<[number, number] | null>(
        latitude && longitude ? [latitude, longitude] : null
    );
    const [isClient, setIsClient] = useState(false);
    const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);

    // Default center (e.g., center of India or a default location)
    const defaultCenter: [number, number] = [20.5937, 78.9629]; // India center

    useEffect(() => {
        setIsClient(true);

        // If we have initial coordinates, use them
        if (latitude && longitude) {
            setPosition([latitude, longitude]);
        }
    }, [latitude, longitude]);

    const handleMapClick = async (lat: number, lng: number) => {
        setPosition([lat, lng]);
        setIsLoadingGeocode(true);

        // Reverse geocode to get location name
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await response.json();
            const name =
                data.display_name?.split(",").slice(0, 3).join(",") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

            onLocationChange({
                locationName: name,
                latitude: lat,
                longitude: lng,
            });
        } catch (error) {
            console.error("Error reverse geocoding:", error);
            onLocationChange({
                locationName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                latitude: lat,
                longitude: lng,
            });
        } finally {
            setIsLoadingGeocode(false);
        }
    };

    const handleMarkerDrag = (e: L.DragEndEvent) => {
        const marker = e.target as L.Marker;
        const latlng = marker.getLatLng();
        handleMapClick(latlng.lat, latlng.lng);
    };

    // Only render map on client side
    if (!isClient) {
        return (
            <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase pl-1">
                    Found Location
                </Label>
                <div className="h-[300px] md:h-[400px] bg-slate-100 rounded-2xl flex items-center justify-center">
                    <p className="text-slate-400">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <Label className="text-xs font-black text-slate-400 uppercase pl-1">
                Found Location
            </Label>

            <div className="relative group">
                <Input
                    value={locationName}
                    onChange={(e) =>
                        onLocationChange({
                            locationName: e.target.value,
                            latitude: position?.[0] || 0,
                            longitude: position?.[1] || 0,
                        })
                    }
                    required
                    disabled={isLoadingGeocode}
                    placeholder="Click on the map to select location"
                    className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 pr-10 focus-visible:ring-teal-500"
                />
                <MapPin
                    className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none ${isLoadingGeocode ? "text-teal-500 animate-pulse" : "text-slate-400 group-focus-within:text-teal-500"
                        }`}
                    size={18}
                />
            </div>

            <div className="rounded-2xl overflow-hidden border-2 border-slate-200">
                <MapContainer
                    center={position || defaultCenter}
                    zoom={position ? 13 : 5}
                    style={{ height: "300px", width: "100%" }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onClick={handleMapClick} />
                    {position && (
                        <Marker
                            position={position}
                            draggable={true}
                            eventHandlers={{
                                dragend: handleMarkerDrag,
                            }}
                        />
                    )}
                </MapContainer>
            </div>

            <p className="text-xs text-slate-500 pl-1">
                Click on the map or drag the marker to select the exact location
            </p>
        </div>
    );
}
