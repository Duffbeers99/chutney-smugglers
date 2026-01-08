"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { Calendar as CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { RestaurantAutocomplete, type PlaceResult } from "./restaurant-autocomplete"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddSoloMissionDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddSoloMissionDrawer({ open, onOpenChange }: AddSoloMissionDrawerProps) {
  // Form state
  const [restaurantName, setRestaurantName] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [googlePlaceId, setGooglePlaceId] = React.useState<string>("")
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | undefined>()
  const [visitDate, setVisitDate] = React.useState<Date | undefined>()
  const [food, setFood] = React.useState<number>(5)
  const [service, setService] = React.useState<number>(3)
  const [extras, setExtras] = React.useState<number>(3)
  const [atmosphere, setAtmosphere] = React.useState<number>(3)
  const [price, setPrice] = React.useState<number>(3)
  const [notes, setNotes] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const addSoloMission = useMutation(api.ratings.addSoloMission)
  const addRestaurant = useMutation(api.restaurants.add)

  // Handle place selection from autocomplete
  const handlePlaceSelect = React.useCallback((place: PlaceResult) => {
    setRestaurantName(place.name)
    setAddress(place.address)
    setGooglePlaceId(place.placeId)
    setLocation(place.location)
  }, [])

  // Reset form when drawer closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setRestaurantName("")
        setAddress("")
        setGooglePlaceId("")
        setLocation(undefined)
        setVisitDate(undefined)
        setFood(5)
        setService(3)
        setExtras(3)
        setAtmosphere(3)
        setPrice(3)
        setNotes("")
      }, 300) // Wait for sheet animation to complete
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!restaurantName.trim()) {
      toast.error("Please select a restaurant from the suggestions")
      return
    }

    if (!address.trim()) {
      toast.error("Please select a restaurant with a valid address")
      return
    }

    if (!visitDate) {
      toast.error("Please select a visit date")
      return
    }

    setLoading(true)

    try {
      // Create a date at midnight for the selected day
      const visitDateMidnight = new Date(visitDate)
      visitDateMidnight.setHours(0, 0, 0, 0)

      // First add/find the restaurant
      const restaurantId = await addRestaurant({
        name: restaurantName.trim(),
        address: address.trim(),
        googlePlaceId: googlePlaceId || undefined,
        location: location,
      })

      // Create the solo mission rating
      await addSoloMission({
        restaurantId,
        visitDate: visitDateMidnight.getTime(),
        food,
        service,
        extras,
        atmosphere,
        price,
        notes: notes.trim() || undefined,
      })

      toast.success("Solo mission submitted! 🌟")
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error creating solo mission:", error)
      toast.error(error.message || "Failed to submit solo mission")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-[oklch(0.55_0.12_85)]">Log Solo Mission</SheetTitle>
          <SheetDescription>
            Rate a curry you've tried on your own
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Restaurant Selection */}
          <div className="space-y-2">
            <Label htmlFor="restaurant">Restaurant *</Label>
            <RestaurantAutocomplete
              onPlaceSelect={handlePlaceSelect}
              initialValue={restaurantName}
            />
          </div>

          {/* Visit Date */}
          <div className="space-y-2">
            <Label>Visit Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !visitDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {visitDate ? format(visitDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={visitDate}
                  onSelect={setVisitDate}
                  initialFocus
                  disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Ratings */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Ratings</h3>

            {/* Food - out of 10 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="food">🍛 Food</Label>
                <span className="text-sm font-bold text-primary">{food}/10</span>
              </div>
              <input
                id="food"
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={food}
                onChange={(e) => setFood(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Service - out of 5 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="service">👨‍🍳 Service</Label>
                <span className="text-sm font-bold text-primary">{service}/5</span>
              </div>
              <input
                id="service"
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={service}
                onChange={(e) => setService(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Extras - out of 5 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="extras">🥘 Extras</Label>
                <span className="text-sm font-bold text-primary">{extras}/5</span>
              </div>
              <input
                id="extras"
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={extras}
                onChange={(e) => setExtras(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Atmosphere - out of 5 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="atmosphere">🪔 Atmosphere</Label>
                <span className="text-sm font-bold text-primary">{atmosphere}/5</span>
              </div>
              <input
                id="atmosphere"
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={atmosphere}
                onChange={(e) => setAtmosphere(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Price - 1-5 */}
            <div className="space-y-2">
              <Label htmlFor="price">💰 Price</Label>
              <Select value={price.toString()} onValueChange={(value) => setPrice(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">£ - Budget</SelectItem>
                  <SelectItem value="2">££ - Moderate</SelectItem>
                  <SelectItem value="3">£££ - Mid-range</SelectItem>
                  <SelectItem value="4">££££ - Upscale</SelectItem>
                  <SelectItem value="5">£££££ - Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Share your thoughts about the food, service, ambiance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {/* Overall Score Display */}
          <div className="rounded-lg bg-[oklch(0.75_0.15_85)]/10 border-2 border-[oklch(0.75_0.15_85)]/30 p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
              <p className="text-3xl font-bold text-[oklch(0.55_0.12_85)]">
                {(food + service + extras + atmosphere).toFixed(1)}/25
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-[oklch(0.75_0.15_85)] hover:bg-[oklch(0.70_0.15_85)] text-white"
            size="lg"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Solo Mission"
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
