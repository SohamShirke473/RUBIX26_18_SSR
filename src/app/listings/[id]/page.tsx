"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, MapPin, User, Phone, Calendar } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "lost" | "found";
  location: string;
  date: string;
  image: string;
  postedBy: {
    name: string;
    avatar: string;
    contact: string;
  };
}

export default function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchItem = async () => {
      try {
        const res = await fetch(`/api/item/${id}`);
        if (!res.ok) throw new Error("Unable to fetch item");
        const data = await res.json();
        setItem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="container py-20">
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-6 text-destructive font-medium">
            {error ?? "Item not found"}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10 space-y-8">
      <Card>
        <CardContent className="p-6 space-y-6">

          {/* Title + Status */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">{item.title}</h1>
            <Badge variant={item.type === "lost" ? "destructive" : "default"}>
              {item.type.toUpperCase()}
            </Badge>
          </div>

          {/* Image */}
          <div className="relative w-full h-[350px] rounded-lg overflow-hidden">
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
            />
          </div>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed">
            {item.description}
          </p>

          <Separator />

          {/* Meta Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <MapPin size={16} /> {item.location}
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} /> {item.date}
            </div>
            <div>Category: {item.category}</div>
          </div>

          <Separator />

          {/* Posted By */}
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={item.postedBy.avatar} />
              <AvatarFallback>{item.postedBy.name[0]}</AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium flex items-center gap-1">
                <User size={14} /> {item.postedBy.name}
              </p>
              <p className="text-muted-foreground flex items-center gap-1">
                <Phone size={14} /> {item.postedBy.contact}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CHAT UI PLACEHOLDER */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-lg">Chat with {item.postedBy.name}</h2>

          <div className="border rounded-lg h-64 bg-muted/40 flex items-center justify-center text-sm text-muted-foreground">
            Chat messages will appear here
          </div>

          <div className="flex gap-2">
            <Input placeholder="Type your message..." />
            <Button>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}