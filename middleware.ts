import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/reset-password",
  "/view/restaurants",
  "/view/leaderboard",
];

// Define routes that should always require authentication
const authenticatedRoutes = [
  "/dashboard",
  "/restaurants",
  "/leaderboards",
  "/history",
  "/profile",
  "/add-rating",
  "/onboarding",
  "/events",
  "/solo-missions",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route is public
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  // Allow all public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if the route requires authentication
  const requiresAuth = authenticatedRoutes.some((route) => pathname.startsWith(route));

  if (requiresAuth) {
    // Check for Convex auth token (stored in cookies by Convex Auth)
    const authToken = request.cookies.get("__convexAuthToken");

    if (!authToken) {
      // Redirect to login page if not authenticated
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // Allow the request to continue
  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
