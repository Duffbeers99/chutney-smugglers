"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/profile/image-upload";
import { Loader2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

export default function AvatarPage() {
  const router = useRouter();
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const removeProfileImage = useMutation(api.users.removeProfileImage);

  const [profileImageId, setProfileImageId] = useState<Id<"_storage"> | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      if (profileImageId) {
        await updateProfile({ profileImageId });
      }
      router.push("/onboarding/nickname");
    } catch (error) {
      console.error("Error saving avatar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/onboarding/nickname");
  };

  const handleRemove = async () => {
    setProfileImageId(null);
    if (user?.profileImageId) {
      await removeProfileImage();
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center mesh-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-curry" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center mesh-gradient p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block paper-aged px-8 py-4 rounded-2xl mb-4">
            <h1 className="text-3xl font-bold text-curry mb-2">
              Add a Profile Picture
            </h1>
            <p className="text-spice text-sm">
              Help your friends recognize you
            </p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="card-parchment p-8">
          <ImageUpload
            currentImageUrl={user.profileImageUrl}
            currentImageId={user.profileImageId}
            userNickname={user.nickname}
            onUploadComplete={(storageId) => setProfileImageId(storageId)}
            onRemove={handleRemove}
          />

          <div className="mt-8 space-y-3">
            <Button
              onClick={handleContinue}
              disabled={loading}
              className="btn-curry w-full h-12 text-base font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue"
              )}
            </Button>

            <Button
              onClick={handleSkip}
              variant="ghost"
              className="w-full text-spice hover:text-curry"
            >
              Skip for now
            </Button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center gap-2">
            <div className="h-2 w-2 rounded-full bg-curry"></div>
            <div className="h-2 w-2 rounded-full bg-terracotta/30"></div>
          </div>
          <p className="text-xs text-spice/60 mt-2">Step 1 of 2</p>
        </div>
      </div>
    </div>
  );
}
