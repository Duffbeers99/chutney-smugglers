"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn("password", { email, password, flow: mode });
      toast.success(mode === "signIn" ? "Welcome back!" : "Account created!");
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
        <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as "signIn" | "signUp")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-old-paper-dark/50">
              <TabsTrigger
                value="signIn"
                className="data-[state=active]:bg-curry data-[state=active]:text-white"
              >
                Sign In
              </TabsTrigger>
              <TabsTrigger
                value="signUp"
                className="data-[state=active]:bg-curry data-[state=active]:text-white"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signIn">
              <form onSubmit={handleSubmit} className="space-y-4">
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
            </TabsContent>

            <TabsContent value="signUp">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email-signup" className="text-spice">
                    Email
                  </Label>
                  <Input
                    id="email-signup"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 bg-white/80 border-terracotta focus:border-curry"
                  />
                </div>
                <div>
                  <Label htmlFor="password-signup" className="text-spice">
                    Password
                  </Label>
                  <Input
                    id="password-signup"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
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
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}
