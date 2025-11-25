"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { ImageUpload } from "@/components/profile/image-upload";
import { toast } from "sonner";
import {
  Loader2,
  User,
  Mail,
  Edit2,
  Check,
  X,
  LogOut,
  Award,
  TrendingUp,
  Star,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Id } from "@/convex/_generated/dataModel";
import { validateNickname } from "@/lib/onboarding-flow";

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.currentUser);
  const userStats = useQuery(api.users.getUserStats);
  const userRatings = useQuery(api.ratings.getUserRatings, {});
  const updateProfile = useMutation(api.users.updateProfile);
  const removeProfileImage = useMutation(api.users.removeProfileImage);

  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  const handleEditNickname = () => {
    setNickname(user?.nickname || "");
    setEditingNickname(true);
  };

  const handleSaveNickname = async () => {
    const validation = validateNickname(nickname);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setSavingNickname(true);
    try {
      await updateProfile({ nickname: nickname.trim() });
      toast.success("Nickname updated!");
      setEditingNickname(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update nickname");
    } finally {
      setSavingNickname(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNickname(false);
    setNickname("");
  };

  const handleImageUpload = async (storageId: Id<"_storage">) => {
    try {
      await updateProfile({ profileImageId: storageId });
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile image");
    }
  };

  const handleRemoveImage = async () => {
    try {
      await removeProfileImage();
      toast.success("Profile image removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove image");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    toast.success("Signed out successfully");
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-old-paper">
        <Loader2 className="h-8 w-8 animate-spin text-curry" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-old-paper paper-texture pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-old-paper/95 backdrop-blur-sm border-b-2 border-terracotta/20 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-curry/10">
            <User className="h-6 w-6 text-curry" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-curry">Profile</h1>
            <p className="text-sm text-spice/70">Your curry journey</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Profile Image Section */}
        <section className="card-parchment p-6">
          <ImageUpload
            currentImageUrl={user.profileImageUrl}
            currentImageId={user.profileImageId}
            userNickname={user.nickname}
            onUploadComplete={handleImageUpload}
            onRemove={handleRemoveImage}
          />
        </section>

        {/* Profile Info Section */}
        <section className="card-parchment p-6 space-y-4">
          <h2 className="text-lg font-semibold text-spice border-b-2 border-terracotta/20 pb-2">
            Profile Information
          </h2>

          {/* Nickname */}
          <div>
            <Label className="text-spice text-sm">Nickname</Label>
            {editingNickname ? (
              <div className="flex gap-2 mt-2">
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Enter nickname"
                  className="bg-white/80 border-terracotta focus:border-curry"
                  autoFocus
                />
                <Button
                  onClick={handleSaveNickname}
                  disabled={savingNickname}
                  size="icon"
                  className="bg-curry hover:bg-curry/90"
                >
                  {savingNickname ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  disabled={savingNickname}
                  size="icon"
                  variant="outline"
                  className="border-terracotta"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-2 p-3 rounded-lg bg-white/50 border border-terracotta/30">
                <span className="font-medium text-spice">
                  {user.nickname || "Not set"}
                </span>
                <Button
                  onClick={handleEditNickname}
                  size="sm"
                  variant="ghost"
                  className="text-curry hover:text-curry/80"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Email (Read-only) */}
          <div>
            <Label className="text-spice text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <div className="mt-2 p-3 rounded-lg bg-white/30 border border-terracotta/20">
              <span className="text-spice/70">{user.email || "Not set"}</span>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="card-parchment p-6">
          <h2 className="text-lg font-semibold text-spice border-b-2 border-terracotta/20 pb-2 mb-4">
            Your Statistics
          </h2>

          {userStats === undefined || userStats === null ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-curry" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Award className="h-5 w-5" />}
                label="Total Ratings"
                value={userStats.totalRatings}
                color="curry"
              />
              <StatCard
                icon={<TrendingUp className="h-5 w-5" />}
                label="This Month"
                value={userStats.ratingsThisMonth}
                color="saffron"
              />
              <StatCard
                icon={<Star className="h-5 w-5" />}
                label="Avg Rating"
                value={userStats.averageRating.toFixed(1)}
                color="terracotta"
              />
              <StatCard
                icon={<span className="text-xl">🍛</span>}
                label="Added"
                value={userStats.curriesAdded}
                color="turmeric"
              />
            </div>
          )}
        </section>

        {/* Recent Ratings */}
        <section className="card-parchment p-6">
          <h2 className="text-lg font-semibold text-spice border-b-2 border-terracotta/20 pb-2 mb-4">
            Your Recent Ratings
          </h2>

          {userRatings === undefined ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-curry" />
            </div>
          ) : userRatings.length === 0 ? (
            <div className="text-center py-8 text-spice/60">
              <p>No ratings yet</p>
              <p className="text-sm mt-1">Start rating curries!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userRatings.slice(0, 5).map((rating) => (
                <div
                  key={rating._id}
                  className="p-3 rounded-lg bg-white/50 border border-terracotta/20"
                >
                  <h3 className="font-semibold text-spice">
                    {rating.restaurant?.name || "Unknown"}
                  </h3>
                  <div className="flex gap-4 mt-2 text-xs text-spice/70">
                    <span>Food: {rating.food}/5</span>
                    <span>Service: {rating.service}/5</span>
                    <span>Extras: {rating.extras}/5</span>
                    <span>Atmosphere: {rating.atmosphere}/5</span>
                  </div>
                  {rating.notes && (
                    <p className="text-sm text-spice/80 mt-2 italic">
                      "{rating.notes}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="outline"
          className="w-full border-red-500 text-red-600 hover:bg-red-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    curry: "bg-curry/10 text-curry",
    saffron: "bg-saffron/10 text-saffron",
    terracotta: "bg-terracotta/10 text-terracotta",
    turmeric: "bg-turmeric/10 text-turmeric",
  };

  return (
    <div className="p-4 rounded-lg bg-white/50 border border-terracotta/20">
      <div className={`inline-flex p-2 rounded-lg ${colorClasses[color]} mb-2`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-spice">{value}</div>
      <div className="text-xs text-spice/60">{label}</div>
    </div>
  );
}
