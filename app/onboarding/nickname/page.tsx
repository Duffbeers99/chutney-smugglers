"use client";

export const dynamic = 'force-dynamic'

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { validateNickname } from "@/lib/onboarding-flow";
import { Loader2 } from "lucide-react";

export default function NicknamePage() {
  const router = useRouter();
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate nickname
      const validation = validateNickname(nickname);
      if (!validation.valid) {
        toast.error(validation.error);
        setLoading(false);
        return;
      }

      // Update profile with nickname
      await updateProfile({ nickname: nickname.trim() });

      // Mark onboarding as complete
      await completeOnboarding();

      toast.success("Welcome to Chutney Smugglers!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error setting nickname:", error);
      toast.error(error.message || "Failed to set nickname. Please try again.");
    } finally {
      setLoading(false);
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
              Choose Your Nickname
            </h1>
            <p className="text-spice text-sm">
              This is how your friends will see you
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="card-parchment p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="nickname" className="text-spice text-base">
                Nickname
              </Label>
              <Input
                id="nickname"
                type="text"
                placeholder="Curry Master"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                required
                minLength={2}
                maxLength={30}
                className="mt-2 bg-white/80 border-terracotta focus:border-curry h-12 text-base"
                autoFocus
              />
              <p className="text-xs text-spice/70 mt-2">
                2-30 characters, letters, numbers, spaces, underscores, and hyphens
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || nickname.length < 2}
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
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-spice/60">
              You can always change this later in your profile settings
            </p>
          </div>
        </div>

        {/* Skip option */}
        <div className="text-center mt-4">
          <button
            onClick={async () => {
              // Use email as fallback nickname
              const fallbackNickname = user.email?.split("@")[0] || "Curry Lover";
              await updateProfile({ nickname: fallbackNickname });
              await completeOnboarding();
              router.push("/dashboard");
            }}
            className="text-sm text-spice/70 hover:text-curry transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
