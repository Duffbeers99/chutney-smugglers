"use client";

import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const user = useQuery(api.users.currentUser);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // If user query has loaded and user is not authenticated, redirect to login
    if (user === null && !hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      router.push("/");
    }
  }, [user, router]);

  // Show loading state while checking authentication
  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center mesh-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-curry" />
      </div>
    );
  }

  // If user is null, we're redirecting, show loading
  if (user === null) {
    return (
      <div className="flex min-h-screen items-center justify-center mesh-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-curry" />
      </div>
    );
  }

  // User is authenticated, show the page
  return (
    <>
      {children}
      <FloatingActionButton />
    </>
  )
}
