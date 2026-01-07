"use client"

import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, MapPin, Search, Star, UtensilsCrossed, Pencil, AlertCircle, List, Map, ChevronDown, ScrollText, FileText, Calendar, Users } from "lucide-react"
import { EditRestaurantDrawer } from "@/components/restaurant/edit-restaurant-drawer"
import { RestaurantMap } from "@/components/restaurant/restaurant-map"
import { PriceDisplay } from "@/components/ui/price-display"
import type { Id } from "@/convex/_generated/dataModel"
import { format } from "date-fns"

export default function RestaurantsPage() {
  const restaurants = useQuery(api.restaurants.list)
  const allEvents = useQuery(api.curryEvents.getAllEvents)
  const [searchTerm, setSearchTerm] = useState("")
  const [view, setView] = useState<"list" | "map" | "history">("list")

  // Filter restaurants based on search term
  const filteredRestaurants = restaurants?.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cuisine?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter restaurants with location data for map view
  const restaurantsWithLocation = restaurants?.filter(
    (restaurant): restaurant is typeof restaurant & { location: { lat: number; lng: number } } =>
      restaurant.location !== undefined
  )

  // Filter for completed events with revealed ratings (for history view)
  const completedEvents = allEvents
    ? allEvents
        .filter((event) => event.status === "completed" && event.ratingsRevealed)
        .sort((a, b) => b.scheduledDate - a.scheduledDate)
    : []

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

        {/* View Toggle */}
        <div className="mt-4 flex justify-center">
          <ToggleGroup
            type="single"
            value={view}
            onValueChange={(value) => {
              if (value) setView(value as "list" | "map" | "history")
            }}
          >
            <ToggleGroupItem value="list" aria-label="List view" className="gap-2">
              <List className="h-4 w-4" />
              List
            </ToggleGroupItem>
            <ToggleGroupItem value="map" aria-label="Map view" className="gap-2">
              <Map className="h-4 w-4" />
              Map
            </ToggleGroupItem>
            <ToggleGroupItem value="history" aria-label="History view" className="gap-2">
              <ScrollText className="h-4 w-4" />
              History
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Search Bar - only show in list view */}
        {view === "list" && (
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
        )}
      </header>

      {/* Main Content */}
      <main className={view === "map" ? "h-[calc(100vh-180px)]" : "p-4 space-y-4 pb-28"}>
        {view === "list" ? (
          // List View
          <>
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
          </>
        ) : view === "map" ? (
          // Map View
          <RestaurantMap restaurants={restaurantsWithLocation || []} />
        ) : (
          // History View
          <HistoryView events={completedEvents} />
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function RestaurantCard({ restaurant }: { restaurant: any }) {
  const router = useRouter()
  const hasRatings = restaurant.totalRatings > 0
  const isIncomplete = restaurant.isIncomplete === true
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const handleNameClick = () => {
    router.push(`/restaurants/${restaurant._id}`)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditDrawerOpen(true)
  }

  return (
    <>
      <Card className="card-parchment">
        <CardContent className="p-4">
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            {/* Main visible content */}
            <div className="flex items-start justify-between gap-4">
              {/* Restaurant Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className="font-semibold text-foreground text-lg truncate cursor-pointer hover:text-curry transition-colors"
                    onClick={handleNameClick}
                  >
                    {restaurant.name}
                  </h3>
                  {isIncomplete && (
                    <Badge variant="outline" className="shrink-0 border-yellow-500 text-yellow-700 dark:text-yellow-500">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Incomplete
                    </Badge>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleEditClick}
                    className="h-7 w-7 shrink-0"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <p className="text-sm truncate">{restaurant.address}</p>
                </div>
              </div>

              {/* Rating and Expand Button */}
              <div className="flex items-center gap-2">
                {hasRatings ? (
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <span className="text-xl font-bold text-primary">
                        {restaurant.overallAverage?.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">/25</span>
                    </div>
                    {restaurant.averagePriceRanking && (
                      <div className="flex justify-end mt-1">
                        <PriceDisplay level={restaurant.averagePriceRanking} size="sm" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-shrink-0 text-right">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">No ratings</p>
                  </div>
                )}

                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isOpen ? "transform rotate-180" : ""
                      }`}
                    />
                    <span className="sr-only">Toggle details</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* Expandable Content */}
            <CollapsibleContent className="space-y-3 pt-4">
              {/* Booker Info */}
              {restaurant.booker && (
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Avatar className="h-6 w-6 border border-border">
                    {restaurant.booker.profileImageUrl && (
                      <AvatarImage
                        src={restaurant.booker.profileImageUrl}
                        alt={restaurant.booker.nickname || "Booker"}
                      />
                    )}
                    <AvatarFallback className="bg-curry/25 text-curry text-xs">
                      {restaurant.booker.nickname?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    Booked by {restaurant.booker.nickname}
                  </span>
                </div>
              )}

              {/* Category Ratings */}
              {hasRatings && (
                <>
                  <div className="grid grid-cols-2 gap-2">
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

                  {/* Number of ratings */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      {restaurant.totalRatings} {restaurant.totalRatings === 1 ? "rating" : "ratings"}
                    </p>
                  </div>
                </>
              )}

              {/* Individual Ratings with Notes */}
              {restaurant.ratings && restaurant.ratings.length > 0 && (
                <div className="pt-3 border-t border-border space-y-3">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Individual Ratings</h4>
                  {[...restaurant.ratings]
                    .sort((a: any, b: any) => b.createdAt - a.createdAt)
                    .map((rating: any) => (
                    <div key={rating._id} className="bg-muted/30 rounded-lg p-3 space-y-2">
                      {/* User info */}
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7 border border-border">
                          {rating.profileImageUrl && (
                            <AvatarImage
                              src={rating.profileImageUrl}
                              alt={rating.userName}
                            />
                          )}
                          <AvatarFallback className="bg-curry/25 text-curry text-xs">
                            {rating.userName?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {rating.userName}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="text-sm font-bold text-primary">
                            {rating.overallScore}
                          </span>
                          <span className="text-xs text-muted-foreground">/25</span>
                        </div>
                      </div>

                      {/* Score breakdown */}
                      <div className="grid grid-cols-4 gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          <span>🍛</span>
                          <span className="text-muted-foreground">{rating.food}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>👨‍🍳</span>
                          <span className="text-muted-foreground">{rating.service}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🥘</span>
                          <span className="text-muted-foreground">{rating.extras}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🪔</span>
                          <span className="text-muted-foreground">{rating.atmosphere}</span>
                        </div>
                      </div>

                      {/* Notes */}
                      {rating.notes && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs text-muted-foreground italic">
                            "{rating.notes}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Cuisine badge if exists */}
              {restaurant.cuisine && (
                <div className="pt-2">
                  <Badge variant="secondary" className="bg-saffron/25 text-foreground border-0">
                    {restaurant.cuisine}
                  </Badge>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Edit Drawer */}
      <EditRestaurantDrawer
        open={isEditDrawerOpen}
        onOpenChange={setIsEditDrawerOpen}
        restaurant={{
          _id: restaurant._id as Id<"restaurants">,
          name: restaurant.name,
          address: restaurant.address,
        }}
      />
    </>
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

function HistoryView({ events }: { events: any[] }) {
  const router = useRouter()

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ScrollText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-foreground font-semibold mb-2">No completed curries yet</p>
        <p className="text-sm text-muted-foreground text-center">
          Complete your first curry event to see it here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Generate Substack articles for past curries
      </p>
      {events.map((event, index) => (
        <EventCard
          key={event._id}
          event={event}
          weekNumber={events.length - index}
          onGenerateArticle={() => router.push(`/events/${event._id}/article`)}
        />
      ))}
    </div>
  )
}

function EventCard({
  event,
  weekNumber,
  onGenerateArticle,
}: {
  event: any
  weekNumber: number
  onGenerateArticle: () => void
}) {
  const eventDate = new Date(event.scheduledDate)
  const formattedDate = format(eventDate, "MMM d, yyyy")

  return (
    <Card className="card-parchment">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                Week {weekNumber}
              </Badge>
              {event.hasVoted && event.hasVoted.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {event.hasVoted.length} {event.hasVoted.length === 1 ? "rating" : "ratings"}
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg text-foreground">{event.restaurantName}</h3>
            <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{event.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{formattedDate}</span>
              </div>
              {event.attendees && event.attendees.length > 0 && (
                <div className="flex items-center gap-2">
                  <Users className="h-3 w-3 shrink-0" />
                  <span>{event.attendees.length} attendees</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <Button
          onClick={onGenerateArticle}
          className="w-full"
          variant="outline"
        >
          <FileText className="mr-2 h-4 w-4" />
          Generate Substack Article
        </Button>
      </CardContent>
    </Card>
  )
}
