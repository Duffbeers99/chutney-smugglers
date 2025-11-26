"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, ChefHat, Loader2, Plus, Star } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"

export default function AddRatingPage() {
  const router = useRouter()
  const restaurants = useQuery(api.restaurants.list)
  const addRestaurant = useMutation(api.restaurants.add)
  const addRating = useMutation(api.ratings.add)

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<Id<"restaurants"> | null>(null)
  const [showAddRestaurant, setShowAddRestaurant] = useState(false)

  // New restaurant form
  const [newRestaurantName, setNewRestaurantName] = useState("")
  const [newRestaurantAddress, setNewRestaurantAddress] = useState("")
  const [newRestaurantCuisine, setNewRestaurantCuisine] = useState("")

  // Rating form
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split("T")[0])
  const [food, setFood] = useState(3)
  const [service, setService] = useState(3)
  const [extras, setExtras] = useState(3)
  const [atmosphere, setAtmosphere] = useState(3)
  const [notes, setNotes] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddRestaurant = async () => {
    if (!newRestaurantName.trim() || !newRestaurantAddress.trim()) {
      toast.error("Please enter restaurant name and address")
      return
    }

    setIsSubmitting(true)
    try {
      const restaurantId = await addRestaurant({
        name: newRestaurantName.trim(),
        address: newRestaurantAddress.trim(),
        cuisine: newRestaurantCuisine.trim() || undefined,
      })

      setSelectedRestaurantId(restaurantId)
      setShowAddRestaurant(false)
      setNewRestaurantName("")
      setNewRestaurantAddress("")
      setNewRestaurantCuisine("")
      toast.success("Restaurant added successfully!")
    } catch (error: any) {
      toast.error(error.message || "Failed to add restaurant")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitRating = async () => {
    if (!selectedRestaurantId) {
      toast.error("Please select a restaurant")
      return
    }

    setIsSubmitting(true)
    try {
      await addRating({
        restaurantId: selectedRestaurantId,
        visitDate: new Date(visitDate).getTime(),
        food,
        service,
        extras,
        atmosphere,
        notes: notes.trim() || undefined,
      })

      toast.success("Rating added successfully!")
      router.push("/dashboard")
    } catch (error: any) {
      toast.error(error.message || "Failed to add rating")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedRestaurant = restaurants?.find(r => r._id === selectedRestaurantId)

  return (
    <div className="h-screen overflow-y-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Add Rating</h1>
            <p className="text-sm text-muted-foreground">Rate your curry experience</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6 pb-28">
        {/* Restaurant Selection */}
        <Card className="card-parchment">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Select Restaurant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showAddRestaurant ? (
              <>
                {restaurants === undefined ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      {restaurants.map((restaurant) => (
                        <button
                          key={restaurant._id}
                          onClick={() => setSelectedRestaurantId(restaurant._id)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                            selectedRestaurantId === restaurant._id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <h3 className="font-semibold text-foreground">{restaurant.name}</h3>
                          <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                          {restaurant.cuisine && (
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-saffron/20 text-foreground">
                              {restaurant.cuisine}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={() => setShowAddRestaurant(true)}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add New Restaurant
                    </Button>
                  </>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Restaurant Name</Label>
                  <Input
                    value={newRestaurantName}
                    onChange={(e) => setNewRestaurantName(e.target.value)}
                    placeholder="Enter restaurant name"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={newRestaurantAddress}
                    onChange={(e) => setNewRestaurantAddress(e.target.value)}
                    placeholder="Enter address"
                  />
                </div>
                <div>
                  <Label>Cuisine (optional)</Label>
                  <Input
                    value={newRestaurantCuisine}
                    onChange={(e) => setNewRestaurantCuisine(e.target.value)}
                    placeholder="e.g. Indian, Thai"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddRestaurant}
                    disabled={isSubmitting}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add Restaurant
                  </Button>
                  <Button
                    onClick={() => setShowAddRestaurant(false)}
                    variant="outline"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Rating Form (only show when restaurant is selected) */}
        {selectedRestaurantId && (
          <>
            {/* Visit Date */}
            <Card className="card-parchment">
              <CardHeader>
                <CardTitle>Visit Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                />
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card className="card-parchment">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Your Ratings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RatingSlider
                  label="Food Quality"
                  value={food}
                  onChange={setFood}
                  emoji="🍛"
                />
                <RatingSlider
                  label="Service"
                  value={service}
                  onChange={setService}
                  emoji="👨‍🍳"
                />
                <RatingSlider
                  label="Extras (Poppadoms, Chutney, etc.)"
                  value={extras}
                  onChange={setExtras}
                  emoji="🥘"
                />
                <RatingSlider
                  label="Atmosphere"
                  value={atmosphere}
                  onChange={setAtmosphere}
                  emoji="🪔"
                />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="card-parchment">
              <CardHeader>
                <CardTitle>Notes (optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional thoughts about your experience..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitRating}
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Plus className="h-5 w-5 mr-2" />
              )}
              Submit Rating
            </Button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function RatingSlider({
  label,
  value,
  onChange,
  emoji,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  emoji: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          {label}
        </Label>
        <span className="text-lg font-bold text-primary">{value}/5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={`flex-1 h-10 rounded-lg border-2 transition-all ${
              value >= rating
                ? "border-primary bg-primary text-white"
                : "border-border hover:border-primary/50"
            }`}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  )
}
