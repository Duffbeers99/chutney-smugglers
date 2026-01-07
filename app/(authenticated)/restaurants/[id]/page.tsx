"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { Id } from "@/convex/_generated/dataModel"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, MapPin, Star, Loader2, UserPlus, Pencil } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { EditRestaurantDrawer } from "@/components/restaurant/edit-restaurant-drawer"
import { PriceDisplay } from "@/components/ui/price-display"

export default function RestaurantDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [restaurantId, setRestaurantId] = React.useState<Id<"restaurants"> | null>(null)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false)

  // Unwrap params in useEffect
  React.useEffect(() => {
    params.then((p) => {
      setRestaurantId(p.id as Id<"restaurants">)
    })
  }, [params])

  const restaurant = useQuery(
    api.restaurants.get,
    restaurantId ? { id: restaurantId } : "skip"
  )
  const ratings = useQuery(
    api.ratings.getRestaurantRatings,
    restaurantId ? { restaurantId } : "skip"
  )

  const isLoading = !restaurantId || restaurant === undefined || ratings === undefined

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4">
        <p className="text-lg font-semibold mb-4">Restaurant not found</p>
        <Button onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    )
  }

  const hasRatings = ratings && ratings.length > 0

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">
              {restaurant.name}
            </h1>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <p className="truncate">{restaurant.address}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsEditDrawerOpen(true)}
            className="shrink-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>

        {/* Overall Rating */}
        {hasRatings && (
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Overall Rating</p>
              <div className="flex items-center gap-2">
                <Star className="h-6 w-6 fill-primary text-primary" />
                <span className="text-3xl font-bold text-primary">
                  {restaurant.overallAverage?.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">/25</span>
              </div>
              {restaurant.averagePriceRanking && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Price Range</p>
                  <PriceDisplay level={restaurant.averagePriceRanking} size="md" />
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">
                {restaurant.totalRatings}
              </p>
              <p className="text-sm text-muted-foreground">
                {restaurant.totalRatings === 1 ? "rating" : "ratings"}
              </p>
            </div>
          </div>
        )}
      </header>

      {/* Ratings List */}
      <main className="p-4 pb-28 space-y-3">
        {!hasRatings ? (
          <Card className="card-parchment">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No ratings yet for this restaurant</p>
            </CardContent>
          </Card>
        ) : (
          ratings.map((rating) => (
            <RatingCard key={rating._id} rating={rating} />
          ))
        )}
      </main>

      {/* Edit Restaurant Drawer */}
      <EditRestaurantDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        restaurant={{
          _id: restaurant._id,
          name: restaurant.name,
          address: restaurant.address,
        }}
      />
    </div>
  )
}

function RatingCard({ rating }: { rating: any }) {
  const [isClaiming, setIsClaiming] = React.useState(false)
  const claimRatingMutation = useMutation(api.ratings.claimRating)

  const overallRating = rating.food + rating.service + rating.extras + rating.atmosphere

  // Determine who to display - prioritize the actual booker
  const displayUser = rating.claimedBy && rating.claimedByUser
    ? rating.claimedByUser
    : rating.bookerName
      ? { nickname: rating.bookerName, profileImageUrl: null, _id: null }
      : rating.user

  const initials = displayUser?.nickname
    ? displayUser.nickname
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation()
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
    <Card className="card-parchment">
      <CardContent className="p-4">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="size-10 border-2 border-border">
            {displayUser?.profileImageUrl && (
              <AvatarImage
                src={displayUser.profileImageUrl}
                alt={displayUser.nickname}
              />
            )}
            <AvatarFallback className="bg-curry/25 text-curry font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {displayUser?.nickname || "Unknown User"}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(rating.visitDate, "MMM d, yyyy")}
            </p>
          </div>

          <Badge variant="secondary" className="shrink-0 gap-1">
            <Star className="size-3 fill-current" />
            {overallRating.toFixed(1)}/25
          </Badge>
        </div>

        {/* Rating Breakdown */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <span className="text-sm">🍛</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Food</p>
              <p className="text-sm font-semibold">{rating.food.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <span className="text-sm">👨‍🍳</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="text-sm font-semibold">{rating.service.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <span className="text-sm">🥘</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Extras</p>
              <p className="text-sm font-semibold">{rating.extras.toFixed(1)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <span className="text-sm">🪔</span>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Atmosphere</p>
              <p className="text-sm font-semibold">{rating.atmosphere.toFixed(1)}</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {rating.notes && (
          <p className="text-sm text-muted-foreground italic mb-3 p-2 bg-muted/30 rounded">
            "{rating.notes}"
          </p>
        )}

        {/* Claim UI - only show for unclaimed ratings */}
        {rating.bookerName && !rating.claimedBy && (
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Unclaimed
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
          </div>
        )}
      </CardContent>
    </Card>
  )
}
