"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { format } from "date-fns"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { UpcomingCurryCard } from "@/components/curry/upcoming-curry-card"
import { ActiveCurryCard } from "@/components/curry/active-curry-card"
import { DateVotingCard } from "@/components/curry/date-voting-card"
import { DatePollResults } from "@/components/curry/date-poll-results"
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
  // Fetch data
  const user = useQuery(api.users.currentUser)
  const recentRatings = useQuery(api.ratings.getRecentRatings, { limit: 10 })
  const canManageEvents = useQuery(api.curryEvents.canManageEvents)
  const activeEvent = useQuery(api.curryEvents.getActiveEvent)

  // Note: Auto-initialization disabled - rotation order is managed via migration script
  // const initializeBooker = useMutation(api.curryEvents.initializeCurrentUserAsBooker)
  //
  // React.useEffect(() => {
  //   // If user is loaded and can't manage events, initialize them
  //   if (user && canManageEvents === false) {
  //     initializeBooker({})
  //       .then(() => {
  //         console.log("Initialized booking rotation for user")
  //       })
  //       .catch((error) => {
  //         console.error("Failed to initialize booking rotation:", error)
  //       })
  //   }
  // }, [user, canManageEvents, initializeBooker])

  // Loading states
  const isLoadingUser = user === undefined
  const isLoadingRatings = recentRatings === undefined

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden mesh-gradient">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b card-parchment shadow-sm">
        <DashboardHeader user={user} isLoading={isLoadingUser} />
      </header>

      {/* Main Content */}
      <main className="space-y-6 py-6 pb-28">
        {/* Active Curry Card (shows when event has started but not completed) */}
        {activeEvent && <ActiveCurryCard />}

        {/* Upcoming Curry Card (shows when there's a future event) */}
        <UpcomingCurryCard />

        {/* Date Voting Section */}
        <section aria-labelledby="voting-heading" className="px-4 space-y-4">
          <h2 id="voting-heading" className="sr-only">
            Vote for next curry date
          </h2>
          <DateVotingCard />
          <DatePollResults />
        </section>

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
          />
        </section>
      </main>

      {/* Bottom Navigation (includes floating + button) */}
      <BottomNav />
    </div>
  )
}
