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

          // Focus the autocomplete input after a short delay to ensure it's rendered
          setTimeout(() => {
            const input = autocompleteElement.querySelector('input')
            if (input) {
              input.focus()
            }
          }, 100)
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
    <>
      <style jsx global>{`
        gmp-place-autocomplete {
          width: 100%;
        }

        gmp-place-autocomplete input {
          width: 100%;
          height: 2.25rem;
          padding-left: 2.5rem !important;
          padding-right: 0.75rem;
          padding-top: 0.25rem;
          padding-bottom: 0.25rem;
          font-size: 16px !important; /* Prevent mobile zoom */
          line-height: 1.5;
          border-radius: calc(var(--radius) - 2px);
          border: 1px solid hsl(var(--input));
          background-color: transparent;
          color: hsl(var(--foreground));
          transition: all 0.2s;
          outline: none;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
        }

        gmp-place-autocomplete input::placeholder {
          color: hsl(var(--muted-foreground));
        }

        gmp-place-autocomplete input:focus {
          border-color: hsl(var(--ring));
          box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5);
        }

        gmp-place-autocomplete input:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        /* Style the dropdown suggestions */
        .pac-container {
          border-radius: calc(var(--radius) - 2px);
          border: 1px solid hsl(var(--border));
          background-color: hsl(var(--background));
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          margin-top: 4px;
        }

        .pac-item {
          color: hsl(var(--foreground));
          border-color: hsl(var(--border));
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .pac-item:hover {
          background-color: hsl(var(--accent));
        }

        .pac-item-selected {
          background-color: hsl(var(--accent));
        }

        .pac-item-query {
          color: hsl(var(--foreground));
          font-size: 0.875rem;
        }

        .pac-matched {
          font-weight: 600;
        }

        .pac-icon {
          display: none; /* Hide Google's default icon since we have our own MapPin */
        }
      `}</style>
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
    </>
  )
}
