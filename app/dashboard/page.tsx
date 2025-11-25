"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { format } from "date-fns"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { QuickAddButton } from "@/components/dashboard/quick-add-button"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { Calendar, MapPin, Sparkles, Trophy, ChefHat } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

function DashboardHeader({
  user,
  isLoading,
}: {
  user:
    | {
        _id: string
        nickname?: string
        profileImageUrl: string | null
      }
    | null
    | undefined
  isLoading: boolean
}) {
  const router = useRouter()
  const today = new Date()

  if (isLoading) {
    return (
      <div className="flex items-center justify-between px-4 py-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="size-12 rounded-full" />
      </div>
    )
  }

  const initials = user?.nickname
    ? user.nickname
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Calendar className="size-4" aria-hidden="true" />
          <time dateTime={today.toISOString()}>
            {format(today, "EEEE, MMMM d")}
          </time>
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.nickname || "Curry Lover"}!
        </h1>
      </div>

      <button
        onClick={() => router.push("/profile")}
        className="touch-target shrink-0 focus-curry rounded-full transition-transform duration-200 hover:scale-105 active:scale-95"
        aria-label="Go to profile"
      >
        <Avatar className="size-12 border-2 border-curry shadow-lg">
          {user?.profileImageUrl && (
            <AvatarImage src={user.profileImageUrl} alt={user.nickname} />
          )}
          <AvatarFallback className="bg-curry text-curry-foreground font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </button>
    </div>
  )
}

function StatusCard({
  lastVisitDate,
  restaurantName,
}: {
  lastVisitDate?: number
  restaurantName?: string
}) {
  if (!lastVisitDate || !restaurantName) {
    return (
      <Card className="card-parchment mx-4">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <ChefHat className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              No recent visits
            </p>
            <p className="text-xs text-muted-foreground">
              Add your first curry rating to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const daysSinceVisit = Math.floor(
    (Date.now() - lastVisitDate) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card className="card-parchment mx-4 border-l-4 border-l-curry">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex size-12 items-center justify-center rounded-full curry-gradient">
          <MapPin className="size-6 text-white" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            Last visit: {restaurantName}
          </p>
          <p className="text-xs text-muted-foreground">
            {daysSinceVisit === 0
              ? "Today"
              : daysSinceVisit === 1
              ? "Yesterday"
              : `${daysSinceVisit} days ago`}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          <Sparkles className="size-3 mr-1" aria-hidden="true" />
          Recent
        </Badge>
      </CardContent>
    </Card>
  )
}

function AddNewVisitCard() {
  return (
    <Card className="card-parchment mx-4">
      <Accordion type="single" collapsible>
        <AccordionItem value="add-visit" className="border-none">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50 rounded-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-curry/20">
                <Sparkles className="size-5 text-curry" aria-hidden="true" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-foreground">
                  Add New Curry Visit
                </p>
                <p className="text-xs text-muted-foreground">
                  Rate your latest experience
                </p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-3 pt-2">
              <p className="text-sm text-muted-foreground">
                Ready to share your curry experience? Click the floating button
                below or use the navigation bar to add a new rating.
              </p>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  <ChefHat className="size-3 mr-1" aria-hidden="true" />
                  Food Quality
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="size-3 mr-1" aria-hidden="true" />
                  Service
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Trophy className="size-3 mr-1" aria-hidden="true" />
                  Atmosphere
                </Badge>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

function QuickAccessCard() {
  const router = useRouter()

  return (
    <Card className="card-parchment mx-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-5 text-saffron" aria-hidden="true" />
          Quick Access
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push("/leaderboards")}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-lg",
              "border-2 border-border bg-background",
              "hover:border-curry hover:bg-curry/5",
              "transition-all duration-200 active:scale-95",
              "focus-curry touch-target"
            )}
          >
            <Trophy className="size-6 text-curry" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">
              Leaderboards
            </span>
          </button>

          <button
            onClick={() => router.push("/restaurants")}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-lg",
              "border-2 border-border bg-background",
              "hover:border-saffron hover:bg-saffron/5",
              "transition-all duration-200 active:scale-95",
              "focus-curry touch-target"
            )}
          >
            <MapPin className="size-6 text-saffron" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">
              Restaurants
            </span>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const router = useRouter()

  // Fetch data
  const user = useQuery(api.users.currentUser)
  const userStats = useQuery(api.users.getUserStats)
  const recentRatings = useQuery(api.ratings.getRecentRatings, { limit: 10 })

  // Loading states
  const isLoadingUser = user === undefined
  const isLoadingStats = userStats === undefined
  const isLoadingRatings = recentRatings === undefined

  // Calculate participation percentage
  // (this is a placeholder - you'd calculate based on total group curries vs user's ratings)
  const participationPercentage = userStats
    ? Math.min(
        100,
        Math.round(
          (userStats.totalRatings / Math.max(userStats.totalRatings, 20)) * 100
        )
      )
    : 0

  // Get last visit info
  const lastRating = recentRatings?.[0]
  const lastVisitDate = lastRating?.visitDate
  const lastRestaurantName = lastRating?.restaurant?.name

  const handleStatCardClick = (
    cardType: "ratings" | "average" | "participation"
  ) => {
    // Navigate to detailed view based on card type
    switch (cardType) {
      case "ratings":
        router.push("/profile?tab=ratings")
        break
      case "average":
        router.push("/profile?tab=stats")
        break
      case "participation":
        router.push("/leaderboards")
        break
    }
  }

  const handleRatingClick = (ratingId: string) => {
    router.push(`/ratings/${ratingId}`)
  }

  return (
    <div className="min-h-screen mesh-gradient pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b card-parchment shadow-sm">
        <DashboardHeader user={user} isLoading={isLoadingUser} />
      </header>

      {/* Main Content */}
      <main className="space-y-6 py-6">
        {/* Status Card */}
        <StatusCard
          lastVisitDate={lastVisitDate}
          restaurantName={lastRestaurantName}
        />

        {/* Stats Cards */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Your Statistics
          </h2>
          {isLoadingStats ? (
            <div className="grid grid-cols-3 gap-3 px-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="card-parchment">
                  <CardContent className="flex flex-col items-center justify-center gap-3 p-4">
                    <Skeleton className="size-28 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <StatsCards
              ratingsThisMonth={userStats?.ratingsThisMonth || 0}
              totalRatings={userStats?.totalRatings || 0}
              averageRating={userStats?.averageRating || 0}
              participationPercentage={participationPercentage}
              onCardClick={handleStatCardClick}
            />
          )}
        </section>

        {/* Add New Visit Card */}
        <AddNewVisitCard />

        {/* Quick Access */}
        <QuickAccessCard />

        {/* Recent Activity */}
        <section aria-labelledby="activity-heading" className="px-4">
          <h2 id="activity-heading" className="sr-only">
            Recent Activity
          </h2>
          <RecentActivity
            ratings={recentRatings}
            isLoading={isLoadingRatings}
            onRatingClick={handleRatingClick}
          />
        </section>
      </main>

      {/* Floating Action Button */}
      <QuickAddButton />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
