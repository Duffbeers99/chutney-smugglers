"use client"

import * as React from "react"
import { format, formatDistanceToNow } from "date-fns"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Star, TrendingUp, Loader2, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

interface RatingData {
  _id: string
  userId: string
  restaurantId: string
  visitDate: number
  food: number
  service: number
  extras: number
  atmosphere: number
  notes?: string
  createdAt: number
  bookerName?: string
  claimedBy?: string
  user: {
    _id: string
    nickname?: string
    profileImageUrl: string | null
  } | null
  restaurant: {
    _id: string
    name: string
    cuisine?: string
    address: string
  } | null
}

interface RecentActivityProps {
  ratings: RatingData[] | undefined
  isLoading: boolean
  onRatingClick?: (ratingId: string) => void
}

function ActivityItem({
  rating,
  onClick,
}: {
  rating: RatingData
  onClick?: (ratingId: string) => void
}) {
  const [isClaiming, setIsClaiming] = React.useState(false)
  const claimRatingMutation = useMutation(api.ratings.claimRating)

  // Calculate overall rating
  const overallRating =
    (rating.food + rating.service + rating.extras + rating.atmosphere) / 4

  // Get initials for avatar fallback
  const initials = rating.user?.nickname
    ? rating.user.nickname
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-saffron"
    if (rating >= 3.5) return "text-turmeric"
    if (rating >= 2.5) return "text-curry"
    return "text-terracotta"
  }

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering onClick
    setIsClaiming(true)

    try {
      await claimRatingMutation({ ratingId: rating._id as Id<"ratings"> })
      toast.success("Rating claimed successfully!")
    } catch (error) {
      console.error("Failed to claim rating:", error)
      toast.error(error instanceof Error ? error.message : "Failed to claim rating")
    } finally {
      setIsClaiming(false)
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg transition-all duration-200",
        "hover:bg-muted/50 active:scale-[0.98]",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(rating._id)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick(rating._id)
              }
            }
          : undefined
      }
    >
      {/* User Avatar */}
      <Avatar className="size-10 border-2 border-border">
        {rating.user?.profileImageUrl && (
          <AvatarImage
            src={rating.user.profileImageUrl}
            alt={rating.user.nickname}
          />
        )}
        <AvatarFallback className="bg-curry/20 text-curry font-semibold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {rating.user?.nickname || "Unknown User"}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(rating.createdAt, { addSuffix: true })}
            </p>
          </div>

          {/* Overall Rating Badge */}
          <Badge
            variant="secondary"
            className={cn(
              "shrink-0 gap-1 font-semibold",
              getRatingColor(overallRating)
            )}
          >
            <Star className="size-3 fill-current" aria-hidden="true" />
            {overallRating.toFixed(1)}
          </Badge>
        </div>

        {/* Restaurant Info */}
        {rating.restaurant && (
          <div className="mb-2">
            <p className="text-sm font-semibold text-foreground">
              {rating.restaurant.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {rating.restaurant.cuisine || "Curry"} • {rating.restaurant.address}
            </p>
          </div>
        )}

        {/* Rating Breakdown */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-muted-foreground">
            Food: <span className="font-semibold text-foreground">{rating.food}</span>
          </span>
          <span className="text-muted-foreground">
            Service: <span className="font-semibold text-foreground">{rating.service}</span>
          </span>
          <span className="text-muted-foreground">
            Extras: <span className="font-semibold text-foreground">{rating.extras}</span>
          </span>
          <span className="text-muted-foreground">
            Vibe: <span className="font-semibold text-foreground">{rating.atmosphere}</span>
          </span>
        </div>

        {/* Notes (if any) */}
        {rating.notes && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 italic">
            "{rating.notes}"
          </p>
        )}

        {/* Booker and Claim UI */}
        {rating.bookerName && (
          <div className="mt-3 flex items-center justify-between gap-2">
            {rating.claimedBy ? (
              <Badge variant="secondary" className="bg-curry/10 text-curry border border-curry/20">
                Booked by {rating.user?.nickname || "Unknown"}
              </Badge>
            ) : (
              <>
                <Badge variant="outline" className="text-xs">
                  Booked by {rating.bookerName} • Unclaimed
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="h-7 text-xs border-curry text-curry hover:bg-curry/10"
                >
                  {isClaiming ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Claim
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Chevron */}
      {onClick && (
        <ChevronRight
          className="size-5 text-muted-foreground shrink-0 self-center"
          aria-hidden="true"
        />
      )}
    </div>
  )
}

export function RecentActivity({
  ratings,
  isLoading,
  onRatingClick,
}: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card className="card-parchment">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-curry" aria-hidden="true" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-curry" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!ratings || ratings.length === 0) {
    return (
      <Card className="card-parchment">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-curry" aria-hidden="true" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <p className="text-spice font-semibold">No ratings yet</p>
            <p className="text-spice/60 text-sm mt-1">Be the first to rate a curry! Start by adding a new rating.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-parchment">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-curry" aria-hidden="true" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="divide-y divide-border">
          {ratings.map((rating) => (
            <ActivityItem
              key={rating._id}
              rating={rating}
              onClick={onRatingClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
