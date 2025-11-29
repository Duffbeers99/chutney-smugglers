"use client"

import * as React from "react"
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
  const containerRef = React.useRef<HTMLDivElement>(null)
  const { isLoaded, loadError } = useGoogleMaps()

  // Initialize PlaceAutocompleteElement when Google Maps is loaded
  React.useEffect(() => {
    if (!isLoaded || !containerRef.current || disabled) return

    const initAutocomplete = async () => {
      try {
        // Import the PlaceAutocompleteElement from the places library
        const { PlaceAutocompleteElement } = await google.maps.importLibrary("places") as any

        // Create the autocomplete element
        const autocompleteElement = new PlaceAutocompleteElement()

        // Configure it for establishments (restaurants)
        autocompleteElement.setAttribute('placeholder', 'Start typing restaurant name...')

        // Style it to match our design
        Object.assign(autocompleteElement.style, {
          width: '100%',
          paddingLeft: '2.5rem'
        })

        // Listen for place selection
        autocompleteElement.addEventListener('gmp-placeselect', async (event: any) => {
          const place = event.place

          if (!place) return

          // Fetch place details
          await place.fetchFields({
            fields: ['displayName', 'formattedAddress', 'id', 'location']
          })

          const result: PlaceResult = {
            name: place.displayName || '',
            address: place.formattedAddress || '',
            placeId: place.id || '',
          }

          // Add location if available
          if (place.location) {
            result.location = {
              lat: place.location.lat(),
              lng: place.location.lng(),
            }
          }

          // Call parent callback
          onPlaceSelect(result)
        })

        // Clear container and add element
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(autocompleteElement)
        }
      } catch (error) {
        console.error("Error initializing place autocomplete:", error)
      }
    }

    initAutocomplete()

    return () => {
      // Cleanup
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [isLoaded, disabled, onPlaceSelect])

  // Show loading state while Google Maps loads
  if (!isLoaded && !loadError) {
    return (
      <div className="space-y-2">
        <Label>Restaurant Name</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm text-muted-foreground">
            Loading Google Maps...
          </div>
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
        <Label>Restaurant Name</Label>
        <p className="text-xs text-destructive">
          Failed to load Google Maps. Please check your API key and enabled APIs.
        </p>
      </div>
    )
  }

  // Normal autocomplete
  return (
    <div className="space-y-2">
      <Label>Restaurant Name</Label>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
        <div ref={containerRef} className="w-full" />
      </div>
      <p className="text-xs text-muted-foreground">
        Select from suggestions
      </p>
    </div>
  )
}
