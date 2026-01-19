"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

import { MapPin, Clock } from "lucide-react";

const items = [
  { id: 1, type: "lost", title: "Black Leather Wallet", category: "Wallet", location: "Central Park", date: "2 hours ago", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop" },
  { id: 2, type: "found", title: "iPhone 15 Pro", category: "Electronics", location: "Coffee Shop", date: "4 hours ago", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=300&fit=crop" },
  { id: 3, type: "lost", title: "Golden Retriever - Max", category: "Pets", location: "Riverside", date: "1 day ago", image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop" },
  { id: 4, type: "found", title: "Car Keys", category: "Keys", location: "Station", date: "3 hours ago", image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=300&fit=crop" },
];

export default function ListingsPage() {
  return (
    <div className="min-h-screen bg-background px-4">

      <main className="py-10">
        <div className="container-tight">
          <h1 className="text-4xl font-display font-bold mb-8">
            Recent Lost & Found Items
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <Link key={item.id} href={`/item/${item.id}`} className="group">
                <Card className="overflow-hidden rounded-2xl border border-border hover:shadow-md transition">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  </div>

                  <CardContent className="p-4">
                    <div className="flex gap-2 mb-2">
                      <Badge variant={item.type === "lost" ? "destructive" : "default"} >
                        {item.type}
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">{item.category}</p>
                    <h3 className="font-semibold text-sm mb-3">{item.title}</h3>

                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.date}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}
