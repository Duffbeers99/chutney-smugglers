"use client"

import * as React from "react"
import { useMutation } from "convex/react"
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
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { RestaurantAutocomplete, type PlaceResult } from "../curry/restaurant-autocomplete"

interface EditRestaurantDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  restaurant: {
    _id: Id<"restaurants">
    name: string
    address: string
  }
}

export function EditRestaurantDrawer({ open, onOpenChange, restaurant }: EditRestaurantDrawerProps) {
  // Form state
  const [restaurantName, setRestaurantName] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [googlePlaceId, setGooglePlaceId] = React.useState<string>("")
  const [location, setLocation] = React.useState<{ lat: number; lng: number } | undefined>()
  const [loading, setLoading] = React.useState(false)

  const updateRestaurantMutation = useMutation(api.restaurants.updateRestaurantDetails)

  // Handle place selection from autocomplete
  const handlePlaceSelect = React.useCallback((place: PlaceResult) => {
    setRestaurantName(place.name)
    setAddress(place.address)
    setGooglePlaceId(place.placeId)
    setLocation(place.location)
  }, [])

  // Reset form when drawer opens with restaurant data
  React.useEffect(() => {
    if (open) {
      setRestaurantName("")
      setAddress("")
      setGooglePlaceId("")
      setLocation(undefined)
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

    setLoading(true)

    try {
      await updateRestaurantMutation({
        restaurantId: restaurant._id,
        name: restaurantName.trim(),
        address: address.trim(),
        googlePlaceId: googlePlaceId || undefined,
        location,
      })

      toast.success("Restaurant details updated!")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update restaurant:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update restaurant")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[90vh] rounded-t-3xl overflow-hidden flex flex-col p-0"
      >
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <SheetHeader>
            <SheetTitle className="text-xl">
              Complete Restaurant Details
            </SheetTitle>
            <SheetDescription>
              Search for "{restaurant.name}" to add the full address and location details
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="edit-restaurant-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Restaurant Name - Autocomplete */}
            <RestaurantAutocomplete
              onPlaceSelect={handlePlaceSelect}
              disabled={loading}
              initialValue={restaurant.name}
            />

            {/* Address - Read-only display (auto-filled from Google Places) */}
            {address && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Address</label>
                <div className="p-3 rounded-md bg-muted text-sm text-muted-foreground">
                  {address}
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-filled from Google Places
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Fixed footer with actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-background">
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-restaurant-form"
              className="flex-1 curry-gradient text-white"
              disabled={loading || !address}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Details"
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
