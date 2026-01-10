"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getNextOnboardingPath } from "@/lib/onboarding-flow";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Unauthenticated>
        <AuthPage />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedRedirect />
      </Authenticated>
    </>
  );
}

function AuthenticatedRedirect() {
  const router = useRouter();
  const user = useQuery(api.users.currentUser);

  useEffect(() => {
    if (user) {
      const nextPath = getNextOnboardingPath(user);
      router.push(nextPath);
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center mesh-gradient">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-curry" />
        <p className="text-spice">Loading...</p>
      </div>
    </div>
  );
}

function AuthPage() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn("password", { email, password, flow: "signIn" });
      toast.success("Welcome back!");
      // Let the AuthenticatedRedirect component handle routing
      // It will check onboarding status and redirect appropriately
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center mesh-gradient p-4 safe-area-top">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/chutney-logo-full.png"
            alt="Chutney Smugglers"
            width={400}
            height={400}
            priority
            className="w-full max-w-[360px] sm:max-w-[400px] h-auto"
          />
        </div>

        {/* Auth Form */}
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4 bg-white/90 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center text-spice mb-4">Sign In</h2>
            <div>
              <Label htmlFor="email-signin" className="text-spice">
                Email
              </Label>
              <Input
                id="email-signin"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 bg-white/80 border-terracotta focus:border-curry"
              />
            </div>
            <div>
              <Label htmlFor="password-signin" className="text-spice">
                Password
              </Label>
              <Input
                id="password-signin"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 bg-white/80 border-terracotta focus:border-curry"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-base font-semibold bg-[#87431D] hover:bg-[#6d3517] text-white transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <div className="text-center">
              <a
                href="/reset-password"
                className="text-sm text-terracotta hover:text-curry transition-colors"
              >
                Forgot password?
              </a>
            </div>
          </form>

          {/* Public View Button */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-spice/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-transparent px-2 text-spice">Or</span>
            </div>
          </div>

          <Button
            onClick={() => router.push("/view/restaurants")}
            variant="outline"
            className="w-full h-12 text-base font-semibold bg-white/90 hover:bg-white border-2 border-terracotta text-spice hover:text-curry transition-colors"
          >
            See the Smuggler&apos;s Ratings
          </Button>
        </div>
      </div>
    </div>
  );
}
