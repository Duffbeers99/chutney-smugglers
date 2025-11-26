"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, MapPin, Search, Star, UtensilsCrossed } from "lucide-react"

export default function RestaurantsPage() {
  const restaurants = useQuery(api.restaurants.list)
  const [searchTerm, setSearchTerm] = useState("")

  // Filter restaurants based on search term
  const filteredRestaurants = restaurants?.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <UtensilsCrossed className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Restaurants</h1>
            <p className="text-sm text-muted-foreground">
              {restaurants?.length || 0} curry houses
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4 pb-28">
        {restaurants === undefined ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading restaurants...</p>
          </div>
        ) : filteredRestaurants?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-foreground font-semibold mb-2">
              {searchTerm ? "No restaurants found" : "No restaurants yet"}
            </p>
            <p className="text-sm text-muted-foreground text-center">
              {searchTerm
                ? "Try a different search term"
                : "Add your first restaurant when rating a curry!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRestaurants?.map((restaurant) => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function RestaurantCard({ restaurant }: { restaurant: any }) {
  const hasRatings = restaurant.totalRatings > 0

  return (
    <Card className="card-parchment card-hover">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Restaurant Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg truncate">
              {restaurant.name}
            </h3>

            <div className="flex items-center gap-1 mt-1 text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <p className="text-sm truncate">{restaurant.address}</p>
            </div>

            {restaurant.cuisine && (
              <Badge variant="secondary" className="mt-2 bg-saffron/20 text-foreground border-0">
                {restaurant.cuisine}
              </Badge>
            )}
          </div>

          {/* Rating */}
          {hasRatings ? (
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-5 w-5 fill-primary text-primary" />
                <span className="text-2xl font-bold text-primary">
                  {restaurant.overallAverage?.toFixed(1)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {restaurant.totalRatings} {restaurant.totalRatings === 1 ? "rating" : "ratings"}
              </p>
            </div>
          ) : (
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1 mb-1">
                <Star className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">No ratings yet</p>
            </div>
          )}
        </div>

        {/* Category Ratings */}
        {hasRatings && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <CategoryRating
              label="Food"
              value={restaurant.averageFood}
              emoji="🍛"
            />
            <CategoryRating
              label="Service"
              value={restaurant.averageService}
              emoji="👨‍🍳"
            />
            <CategoryRating
              label="Extras"
              value={restaurant.averageExtras}
              emoji="🥘"
            />
            <CategoryRating
              label="Atmosphere"
              value={restaurant.averageAtmosphere}
              emoji="🪔"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CategoryRating({
  label,
  value,
  emoji,
}: {
  label: string
  value?: number
  emoji: string
}) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      <span className="text-sm">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {value?.toFixed(1) || "N/A"}
        </p>
      </div>
    </div>
  )
}
