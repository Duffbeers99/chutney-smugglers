"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Loader2 } from "lucide-react"
import { useGoogleMaps } from "@/hooks/use-google-maps"

export interface PlaceResult {
  name: string
  address: string
  placeId: string
  location?: {
    lat: number
    lng: number
  }
}

interface RestaurantAutocompleteProps {
  onPlaceSelect: (place: PlaceResult) => void
  disabled?: boolean
  initialValue?: string
}

export function RestaurantAutocomplete({
  onPlaceSelect,
  disabled,
  initialValue = "",
}: RestaurantAutocompleteProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const autocompleteRef = React.useRef<google.maps.places.Autocomplete | null>(null)
  const { isLoaded, loadError } = useGoogleMaps()
  const [inputValue, setInputValue] = React.useState(initialValue)

  // Initialize autocomplete when Google Maps is loaded
  React.useEffect(() => {
    if (!isLoaded || !inputRef.current || disabled) return

    try {
      // Initialize Google Places Autocomplete
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        types: ["restaurant"], // Only show restaurants
        fields: ["name", "formatted_address", "place_id", "geometry"], // Minimize API cost
      })

      // Listen for place selection
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace()

        if (!place.name || !place.formatted_address) {
          return
        }

        const result: PlaceResult = {
          name: place.name,
          address: place.formatted_address,
          placeId: place.place_id || "",
        }

        // Add location if available
        if (place.geometry?.location) {
          result.location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }
        }

        // Update input value
        setInputValue(place.name)

        // Call parent callback
        onPlaceSelect(result)
      })

      autocompleteRef.current = autocomplete
    } catch (error) {
      console.error("Error initializing autocomplete:", error)
    }

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isLoaded, disabled, onPlaceSelect])

  // Show loading state while Google Maps loads
  if (!isLoaded && !loadError) {
    return (
      <div className="space-y-2">
        <Label htmlFor="restaurant-search">Restaurant Name</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            disabled
            placeholder="Loading Google Maps..."
            className="pl-10"
          />
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">
          Initializing restaurant search...
        </p>
      </div>
    )
  }

  // Show error state if Google Maps failed to load
  if (loadError) {
    return (
      <div className="space-y-2">
        <Label htmlFor="restaurant-name">Restaurant Name</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="restaurant-name"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              // For manual entry when autocomplete fails
              onPlaceSelect({
                name: e.target.value,
                address: "",
                placeId: "",
              })
            }}
            placeholder="Enter restaurant name manually"
            disabled={disabled}
            className="pl-10"
          />
        </div>
        <p className="text-xs text-destructive">
          Autocomplete unavailable. Enter manually.
        </p>
      </div>
    )
  }

  // Normal autocomplete input
  return (
    <div className="space-y-2">
      <Label htmlFor="restaurant-search">Restaurant Name</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="restaurant-search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Start typing restaurant name..."
          disabled={disabled}
          className="pl-10"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Select from suggestions or enter manually
      </p>
    </div>
  )
}
