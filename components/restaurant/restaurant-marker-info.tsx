"use client"

import { Star, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RestaurantMarkerInfoProps {
  restaurant: {
    _id: string
    name: string
    address: string
    cuisine?: string
    totalRatings: number
    overallAverage?: number
    hasSoloMissions?: boolean
    soloMissionAverage?: number | null
  }
}

export function RestaurantMarkerInfo({ restaurant }: RestaurantMarkerInfoProps) {
  const hasRatings = restaurant.totalRatings > 0
  const hasSoloMissionOnly = !hasRatings && restaurant.soloMissionAverage !== null && restaurant.soloMissionAverage !== undefined
  const displayRating = hasRatings ? restaurant.overallAverage : restaurant.soloMissionAverage
  const hasAnyRating = hasRatings || hasSoloMissionOnly

  return (
    <div className="max-w-[280px] p-3 bg-parchment rounded-lg shadow-lg border border-border">
      {/* Restaurant Name */}
      <h3 className="font-semibold text-foreground text-sm mb-1 leading-tight">
        {restaurant.name}
      </h3>

      {/* Rating and Cuisine */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {hasAnyRating ? (
          <div className="flex items-center gap-1">
            <Star className={hasSoloMissionOnly ? "h-3 w-3 fill-[oklch(0.75_0.15_85)] text-[oklch(0.75_0.15_85)]" : "h-3 w-3 fill-primary text-primary"} />
            <span className={hasSoloMissionOnly ? "text-sm font-bold text-[oklch(0.55_0.12_85)]" : "text-sm font-bold text-primary"}>
              {displayRating?.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">/25</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No ratings yet</span>
        )}

        {restaurant.cuisine && (
          <Badge variant="secondary" className="text-xs bg-saffron/25 text-foreground border-0">
            {restaurant.cuisine}
          </Badge>
        )}

        {restaurant.hasSoloMissions && (
          <Badge variant="outline" className="text-xs border-[oklch(0.75_0.15_85)] text-[oklch(0.55_0.12_85)] bg-[oklch(0.75_0.15_85)]/10">
            Solo Mission
          </Badge>
        )}
      </div>

      {/* Address */}
      <div className="flex items-start gap-1 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3 shrink-0 mt-0.5" />
        <p className="line-clamp-2">{restaurant.address}</p>
      </div>

      {/* Tap hint */}
      <p className="text-xs text-muted-foreground/60 mt-2 italic">
        Tap to view details
      </p>
    </div>
  )
}
