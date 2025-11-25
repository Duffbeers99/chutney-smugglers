"use client";

import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Loader2, X } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface ImageUploadProps {
  currentImageUrl?: string | null;
  currentImageId?: Id<"_storage"> | null;
  userNickname?: string;
  onUploadComplete: (storageId: Id<"_storage">) => void;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export function ImageUpload({
  currentImageUrl,
  currentImageId,
  userNickname,
  onUploadComplete,
  onRemove,
  showRemoveButton = true,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await response.json();
      onUploadComplete(storageId as Id<"_storage">);
      toast.success("Profile image uploaded!");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image. Please try again.");
      setPreviewUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    if (onRemove) {
      onRemove();
    }
  };

  const displayUrl = previewUrl || currentImageUrl;
  const fallback = userNickname
    ? userNickname.slice(0, 2).toUpperCase()
    : "CS";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-32 w-32 border-4 border-terracotta">
          {displayUrl && <AvatarImage src={displayUrl} alt="Profile" />}
          <AvatarFallback className="bg-saffron text-spice text-3xl">
            {fallback}
          </AvatarFallback>
        </Avatar>

        {/* Camera button overlay */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute bottom-0 right-0 p-2 rounded-full bg-curry text-white shadow-lg hover:bg-curry/90 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="border-terracotta text-spice hover:bg-terracotta/10"
        >
          {currentImageUrl ? "Change Photo" : "Upload Photo"}
        </Button>

        {showRemoveButton && (currentImageUrl || previewUrl) && (
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            disabled={uploading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-spice/60 text-center">
        JPEG, PNG, or WebP • Max 5MB
      </p>
    </div>
  );
}
