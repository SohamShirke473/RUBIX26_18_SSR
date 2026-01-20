"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

type ItemCategoryType = "wallet" | "phone" | "keys" | "bag" | "documents" | "electronics" | "jewelry" | "clothing" | "id_card" | "cash" | "other";

const EditListingPage = () => {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const isValidId = params.id && params.id.length > 5 && !params.id.includes("/");
  const listingId = params.id as Id<"listings">;
  const listing = useQuery(api.getListing.getListingById, isValidId ? { id: listingId } : "skip");
  const updateListing = useMutation(api.report.updateListing);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<ItemCategoryType[]>([]);
  const [locationName, setLocationName] = useState("");
  const [color, setColor] = useState("");
  const [brand, setBrand] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const MAX_DESCRIPTION_LENGTH = 500;
  const descriptionLength = description.length;

  // Initialize form with listing data
  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setDescription(listing.description);
      setCategories(listing.categories as ItemCategoryType[]);
      setLocationName(listing.locationName);
      setColor(listing.color || "");
      setBrand(listing.brand || "");
    }
  }, [listing]);

  // Check authorization
  if (listing === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (listing === null) {
    return (
      <div className="container max-w-2xl py-20 px-4">
        <div className="border-2 border-destructive/50 dark:border-destructive/60 bg-destructive/10 dark:bg-destructive/20 rounded-xl p-8 text-center">
          <p className="text-destructive dark:text-red-400 font-semibold text-lg">Listing not found</p>
        </div>
      </div>
    );
  }

  if (isLoaded && user && listing.clerkUserId !== user.id) {
    return (
      <div className="container max-w-2xl py-20 px-4">
        <div className="border-2 border-orange-500/50 dark:border-orange-600/50 bg-orange-100/20 dark:bg-orange-950/30 rounded-xl p-8 text-center flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400 shrink-0 mt-1" />
          <div className="text-left">
            <p className="text-orange-900 dark:text-orange-200 font-semibold">Access Denied</p>
            <p className="text-orange-800 dark:text-orange-300 text-sm mt-1">You can only edit your own listings.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate description length
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      await updateListing({
        listingId,
        title: title.trim(),
        description: description.trim(),
        categories,
        locationName: locationName.trim(),
        color: color.trim() || undefined,
        brand: brand.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/listings/${listingId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update listing");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50 flex flex-col items-center">
      <div className="bg-teal-500 h-2 w-full" />
      <div className="container max-w-2xl py-10 px-4">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          className="mb-8 text-slate-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-all font-bold uppercase text-xs tracking-widest group p-0 hover:bg-transparent dark:hover:bg-transparent"
        >
          <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </Button>

        <Card className="border-2 border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-lg dark:shadow-xl rounded-2xl">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-8">Edit Listing</h1>

            {success && (
              <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                <p className="text-green-800 dark:text-green-200 font-medium">Listing updated successfully!</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Item Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Blue JBL Headphones"
                  className="text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Category</Label>
                <Select
                  value={categories[0] || ""}
                  onValueChange={(val) => setCategories([val as ItemCategoryType])}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "wallet",
                      "phone",
                      "keys",
                      "bag",
                      "documents",
                      "electronics",
                      "jewelry",
                      "clothing",
                      "id_card",
                      "cash",
                      "other",
                    ].map((cat) => (
                      <SelectItem key={cat} value={cat} className="capitalize">
                        {cat.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="color" className="text-sm font-semibold">
                    Color (Optional)
                  </Label>
                  <Input
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g., Black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand" className="text-sm font-semibold">
                    Brand (Optional)
                  </Label>
                  <Input
                    id="brand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g., Apple"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-semibold">
                  Location
                </Label>
                <Input
                  id="location"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g., Library 2nd Floor"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-sm font-semibold">
                    Description
                  </Label>
                  <span
                    className={`text-xs font-medium ${descriptionLength > MAX_DESCRIPTION_LENGTH
                      ? "text-red-600"
                      : descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9
                        ? "text-orange-600"
                        : "text-slate-400"
                      }`}
                  >
                    {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                  </span>
                </div>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the item in detail..."
                  className={`min-h-[150px] ${descriptionLength > MAX_DESCRIPTION_LENGTH
                    ? "border-2 border-red-500"
                    : descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9
                      ? "border-2 border-orange-300"
                      : ""
                    }`}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-10 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditListingPage;
