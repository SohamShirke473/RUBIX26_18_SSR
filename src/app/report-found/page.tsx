"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import {
  Heart,
  MapPin,
  CheckCircle,
  Package,
  ShieldCheck,
  ArrowLeft,
  Camera,
  X,
  PartyPopper,
  MessageSquare,
} from "lucide-react";

import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

/* ---------- Types ---------- */

type ItemCategoryType =
  | "wallet"
  | "phone"
  | "keys"
  | "bag"
  | "documents"
  | "electronics"
  | "jewelry"
  | "clothing"
  | "id_card"
  | "cash"
  | "other";

interface FoundFormData {
  itemName: string;
  location: string;
  description: string;
  image: File | null;
  category: ItemCategoryType;
  color?: string;
  brand?: string;
}

/* ---------- Component ---------- */

const ReportFound: React.FC = () => {
  const generateUploadUrl = useMutation(api.report.generateUploadUrl);
  const createListing = useMutation(api.report.createListing);

  const initialState: FoundFormData = {
    itemName: "",
    location: "",
    description: "",
    image: null,
    category: "other",
    color: "",
    brand: "",
  };

  const [formData, setFormData] = useState<FoundFormData>(initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const MAX_DESCRIPTION_LENGTH = 500;
  const descriptionLength = formData.description.length;

  /* ---------- Handlers ---------- */

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value: ItemCategoryType) => {
    setFormData((prev) => ({ ...prev, category: value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validate description length
    if (formData.description.length > MAX_DESCRIPTION_LENGTH) {
      setError(`Description exceeds maximum length of ${MAX_DESCRIPTION_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload Image (if exists)
      let storageId: Id<"_storage"> | undefined;
      if (formData.image) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": formData.image.type },
          body: formData.image,
        });

        if (!result.ok) {
          throw new Error(`Upload failed: ${result.statusText}`);
        }

        const json = await result.json();
        storageId = json.storageId;
      }

      // 2. Submit Listing
      await createListing({
        title: formData.itemName,
        description: formData.description,
        type: "found",
        categories: [formData.category],
        locationName: formData.location,
        images: storageId ? [storageId] : [],
        color: formData.color || undefined,
        brand: formData.brand || undefined,
      });

      // 3. Success Feedback
      setShowSuccess(true);
      setTimeout(() => {
        setFormData(initialState);
        setImagePreview(null);
        setShowSuccess(false);
        setIsSubmitting(false);
      }, 2500);

    } catch (error) {
      console.error("Submission failed:", error);
      setError(error instanceof Error ? error.message : "Failed to submit report. Please try again.");
      setIsSubmitting(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans relative overflow-hidden">
      <div className="bg-teal-500 h-2 w-full" />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <a href="/">
          <Button variant="ghost" className="mb-8 text-slate-400 hover:text-teal-600 transition-all font-bold uppercase text-xs tracking-widest group p-0 hover:bg-transparent">
            <ArrowLeft
              size={16}
              className="mr-2 group-hover:-translate-x-1 transition-transform"
            />
            Exit to Home
          </Button>
        </a>

        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Left Column */}
          <div className="lg:w-1/3 space-y-8">
            <div className="w-20 h-20 bg-teal-50 rounded-[2.5rem] flex items-center justify-center shadow-inner">
              <Heart className="text-teal-500 fill-teal-500" size={32} />
            </div>

            <div>
              <h1 className="text-5xl font-black leading-[1.1]">
                Found an <span className="text-teal-500">Item?</span>
              </h1>
              <p className="text-xl text-slate-500 mt-6 leading-relaxed">
                You're doing a great thing. Fill in the details to reunite this
                item with its owner.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4">
              <ShieldCheck className="text-teal-500 shrink-0" size={24} />
              <p className="text-sm text-slate-600 font-medium">
                <strong>Safety First:</strong> Avoid sharing your personal phone
                number in the public description.
              </p>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:w-2/3 w-full relative">
            {showSuccess && (
              <div className="absolute inset-0 bg-white/95 z-30 flex flex-col items-center justify-center rounded-[3rem] animate-in fade-in zoom-in duration-500">
                <div className="bg-teal-100 p-6 rounded-full mb-4">
                  <PartyPopper
                    className="text-teal-600 animate-bounce"
                    size={48}
                  />
                </div>
                <h2 className="text-4xl font-black">Thank You!</h2>
                <p className="text-slate-500 mt-2 font-medium">
                  Your good deed is now live on the feed.
                </p>
              </div>
            )}

            <Card className={cn(
              "border-2 border-slate-50 shadow-2xl shadow-teal-900/10 transition-all duration-500 rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-sm",
              isSubmitting && "blur-sm grayscale"
            )}>
              <CardContent className="p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Image Upload */}
                  <div className="space-y-3">
                    <Label className="text-xs font-black text-teal-600 uppercase tracking-widest pl-1">
                      Snap a Photo
                    </Label>

                    {!imagePreview ? (
                      <div className="relative group border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-3xl p-10 flex flex-col items-center justify-center bg-slate-50/30 cursor-pointer transition-colors">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                          <Camera className="text-teal-500" size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-400">
                          Click or Drag to Upload
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="absolute inset-0 opacity-0 cursor-pointer h-full w-full"
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-3xl overflow-hidden h-56 border-4 border-teal-50">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData((p) => ({ ...p, image: null }));
                          }}
                          className="absolute top-4 right-4 rounded-full shadow-xl"
                        >
                          <X size={20} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Item Name */}
                  <div className="space-y-2">
                    <Label htmlFor="itemName" className="text-xs font-black text-teal-600 uppercase tracking-widest pl-1">
                      Item Name
                    </Label>
                    <div className="relative group">
                      <Input
                        id="itemName"
                        name="itemName"
                        value={formData.itemName}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Blue JBL Headphones"
                        className="h-14 text-lg bg-slate-50 border-slate-200 rounded-2xl px-4 focus-visible:ring-teal-500"
                      />
                      <Package
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none"
                        size={24}
                      />
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-black text-teal-600 uppercase tracking-widest pl-1">
                      Category
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(val) => handleCategoryChange(val as ItemCategoryType)}
                    >
                      <SelectTrigger className="h-14 text-base bg-slate-50 border-slate-200 rounded-2xl px-4 focus:ring-teal-500">
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
                          <SelectItem key={cat} value={cat} className="capitalize cursor-pointer">
                            {cat.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Optional Details: Color & Brand */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="color" className="text-xs font-black text-slate-400 uppercase pl-1">
                        Color (Optional)
                      </Label>
                      <Input
                        id="color"
                        name="color"
                        value={formData.color}
                        onChange={handleChange}
                        placeholder="e.g. Black"
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 focus-visible:ring-teal-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="brand" className="text-xs font-black text-slate-400 uppercase pl-1">
                        Brand (Optional)
                      </Label>
                      <Input
                        id="brand"
                        name="brand"
                        value={formData.brand}
                        onChange={handleChange}
                        placeholder="e.g. Apple"
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 focus-visible:ring-teal-500"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-xs font-black text-slate-400 uppercase pl-1">
                      Found Location
                    </Label>
                    <div className="relative group">
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        placeholder="Gym Area"
                        className="h-12 bg-slate-50 border-slate-200 rounded-xl px-4 pr-10 focus-visible:ring-teal-500"
                      />
                      <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors pointer-events-none" size={18} />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="description" className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase pl-1">
                        <MessageSquare size={14} className="text-teal-500" />
                        Description & Details
                      </Label>
                      <span className={`text-xs font-medium ${
                        descriptionLength > MAX_DESCRIPTION_LENGTH
                          ? "text-red-600"
                          : descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9
                          ? "text-orange-600"
                          : "text-slate-400"
                      }`}>
                        {descriptionLength}/{MAX_DESCRIPTION_LENGTH}
                      </span>
                    </div>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      placeholder="Describe specific details..."
                      className={`min-h-[120px] bg-slate-50 rounded-2xl p-4 focus-visible:ring-teal-500 resize-none text-base ${
                        descriptionLength > MAX_DESCRIPTION_LENGTH
                          ? "border-2 border-red-500"
                          : descriptionLength > MAX_DESCRIPTION_LENGTH * 0.9
                          ? "border-2 border-orange-300"
                          : "border-slate-200"
                      }`}
                    />
                    {error && (
                      <p className="text-sm text-red-600 font-medium">{error}</p>
                    )}
                  </div>

                  {/* Submit */}
                  <Button
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full h-16 rounded-[2rem] text-xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-200 transition-all hover:-translate-y-1 hover:shadow-teal-100"
                  >
                    {isSubmitting ? "Uploading Report..." : "Post Found Item"}
                    {!isSubmitting && <CheckCircle className="ml-2" size={24} />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportFound;
