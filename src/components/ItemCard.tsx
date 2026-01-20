// components/ItemCard.tsx
"use client"

import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemCardProps {
  id: string;
  type: "lost" | "found";
  title: string;
  category: string;
  location: string;
  date: string | number;
  imageUrl?: string;
  status?: string;
  showStatus?: boolean;
}

export function ItemCard({
  id,
  type,
  title,
  category,
  location,
  date,
  imageUrl,
  status,
  showStatus = false,
}: ItemCardProps) {
  const formattedDate = typeof date === 'number' 
    ? new Date(date).toLocaleDateString()
    : date;

  return (
    <Link href={`/listings/${id}`} className="group">
      <Card className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:shadow-md transition h-full flex flex-col p-0">
        <div className="h-64 overflow-hidden bg-muted relative rounded-t-2xl flex items-center justify-center flex-shrink-0">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain group-hover:scale-105 transition"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
        </div>

        <CardContent className="p-4 flex flex-col flex-1">
          <div className="flex gap-2 mb-2 flex-wrap">
            <Badge variant={type === "lost" ? "destructive" : "default"}>
              {type}
            </Badge>
            {showStatus && status && (
              <Badge 
                variant="outline" 
                className={cn(
                  "capitalize",
                  status === "open" && "text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
                  status === "matched" && "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                  status === "closed" && "text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800"
                )}
              >
                {status}
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground capitalize">{category}</p>
          <h3 className="font-semibold text-sm mb-3 line-clamp-1">{title}</h3>

          <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-auto">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 flex-shrink-0" />
              {formattedDate}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}