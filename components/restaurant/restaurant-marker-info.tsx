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
  }
}

export function RestaurantMarkerInfo({ restaurant }: RestaurantMarkerInfoProps) {
  const hasRatings = restaurant.totalRatings > 0

  return (
    <div className="max-w-[280px] p-3 bg-parchment rounded-lg shadow-lg border border-border">
      {/* Restaurant Name */}
      <h3 className="font-semibold text-foreground text-sm mb-1 leading-tight">
        {restaurant.name}
      </h3>

      {/* Rating and Cuisine */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {hasRatings ? (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span className="text-sm font-bold text-primary">
              {restaurant.overallAverage?.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">/20</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No ratings yet</span>
        )}

        {restaurant.cuisine && (
          <Badge variant="secondary" className="text-xs bg-saffron/20 text-foreground border-0">
            {restaurant.cuisine}
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
