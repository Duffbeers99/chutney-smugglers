"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { ArrowLeft, ChefHat, Loader2, MapPin, Star, Calendar } from "lucide-react"
import { Id } from "@/convex/_generated/dataModel"
import { format } from "date-fns"

export default function AddRatingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventIdParam = searchParams.get("eventId")

  const [eventId, setEventId] = useState<Id<"curryEvents"> | null>(null)

  useEffect(() => {
    if (eventIdParam) {
      setEventId(eventIdParam as Id<"curryEvents">)
    }
  }, [eventIdParam])

  const event = useQuery(
    api.curryEvents.getEventByIdPublic,
    eventId ? { eventId } : "skip"
  )
  const addRating = useMutation(api.ratings.add)

  // Rating form state
  const [food, setFood] = useState(2.5)
  const [service, setService] = useState(2.5)
  const [extras, setExtras] = useState(2.5)
  const [atmosphere, setAtmosphere] = useState(2.5)
  const [price, setPrice] = useState(2.5)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if no eventId provided
  useEffect(() => {
    if (!eventIdParam) {
      toast.error("No event specified")
      router.push("/dashboard")
    }
  }, [eventIdParam, router])

  const handleSubmitRating = async () => {
    if (!eventId) {
      toast.error("No event specified")
      return
    }

    setIsSubmitting(true)
    try {
      await addRating({
        eventId,
        food,
        service,
        extras,
        atmosphere,
        price,
        notes: notes.trim() || undefined,
      })

      toast.success("Rating submitted successfully!")
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Failed to submit rating:", error)
      toast.error(error.message || "Failed to submit rating")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (!eventId || event === undefined) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Event not found or already completed
  if (!event) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Event Not Found</h1>
          <p className="text-muted-foreground">
            This event may have been completed or doesn't exist.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.scheduledDate)

  return (
    <div className="h-screen overflow-y-auto overflow-x-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rate This Curry</h1>
            <p className="text-sm text-muted-foreground">Share your experience</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6 pb-28">
        {/* Event Information (Read-only) */}
        <Card className="card-parchment border-l-4 border-l-curry">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-curry" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {event.restaurantName}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3 w-3" />
                <span>{event.address}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <Calendar className="h-3 w-3" />
                <span>{format(eventDate, "MMM d, yyyy")} at {event.scheduledTime}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ratings */}
        <Card className="card-parchment">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-curry" />
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
            <RatingSlider
              label="Price (£ to £££££)"
              value={price}
              onChange={setPrice}
              emoji="💰"
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
          className="w-full curry-gradient text-white h-12 text-lg"
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Star className="h-5 w-5 mr-2" />
          )}
          Submit Rating
        </Button>
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          {label}
        </Label>
        <span className="text-lg font-bold text-curry">
          {value.toFixed(1)}/5
        </span>
      </div>
      <div className="px-2">
        <Slider
          value={[value]}
          onValueChange={(values) => onChange(values[0])}
          min={0}
          max={5}
          step={0.5}
          className="cursor-pointer"
        />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>0</span>
          <span>2.5</span>
          <span>5</span>
        </div>
      </div>
    </div>
  )
}
