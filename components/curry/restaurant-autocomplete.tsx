"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
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

        // Set placeholder
        autocompleteElement.setAttribute('placeholder', 'Start typing restaurant name...')

        // Add listener to the element itself using the 'place' property
        Object.defineProperty(autocompleteElement, 'addEventListener', {
          value: function(type: string, listener: any) {
            console.log('Adding event listener for:', type)
            HTMLElement.prototype.addEventListener.call(this, type, listener)
          }
        })

        // Handle gmp-select event - this uses a different pattern
        const handlePlaceSelection = async (event: any) => {
          console.log('Event fired! Type:', event.type, 'Event:', event)

          try {
            // For gmp-select event, we need to get the place from the autocomplete element's value
            // The element should have a 'value' property with the place prediction
            const placePrediction = (autocompleteElement as any).value
            console.log('Place prediction from element.value:', placePrediction)

            if (!placePrediction) {
              console.error('No place prediction found on autocomplete element')
              return
            }

            // Convert prediction to Place object
            const place = placePrediction.toPlace ? placePrediction.toPlace() : placePrediction
            console.log('Place object:', place)

            // Fetch the full place details
            await place.fetchFields({
              fields: ['displayName', 'formattedAddress', 'id', 'location']
            })

            console.log('Place after fetchFields:', {
              displayName: place.displayName,
              formattedAddress: place.formattedAddress,
              id: place.id,
              location: place.location
            })

            const result: PlaceResult = {
              name: place.displayName || '',
              address: place.formattedAddress || '',
              placeId: place.id || '',
            }

            if (place.location) {
              result.location = {
                lat: place.location.lat(),
                lng: place.location.lng(),
              }
            }

            console.log('Calling onPlaceSelect with result:', result)
            onPlaceSelect(result)
          } catch (error) {
            console.error('Error in handlePlaceSelection:', error)
          }
        }

        // Try all possible event names
        console.log('Setting up autocomplete element listeners')
        autocompleteElement.addEventListener('gmp-placeselect', handlePlaceSelection)
        autocompleteElement.addEventListener('place_changed', handlePlaceSelection)
        autocompleteElement.addEventListener('gmp-select', handlePlaceSelection)

        // Also try listening on the input element
        setTimeout(() => {
          const input = autocompleteElement.querySelector('input')
          console.log('Input element found:', input)
          if (input) {
            input.addEventListener('change', (e: any) => {
              console.log('Input change event:', e)
              handlePlaceSelection(e)
            })
          }
        }, 500)

        // Clear container and add element
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
          containerRef.current.appendChild(autocompleteElement)

          // Focus the autocomplete input and apply inline styles after a short delay
          setTimeout(() => {
            const input = autocompleteElement.querySelector('input')
            if (input) {
              // Force font-size inline to prevent iOS zoom - this is critical!
              input.style.fontSize = '16px'
              input.style.webkitTextSizeAdjust = '100%'
              input.style.textSizeAdjust = '100%'
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
          <div className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
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
        /* Target the web component container */
        gmp-place-autocomplete {
          width: 100% !important;
          display: block !important;
        }

        /* Target the internal input field - need !important to override Shadow DOM styles */
        gmp-place-autocomplete input,
        gmp-place-autocomplete input[type="text"] {
          width: 100% !important;
          height: 2.25rem !important;
          padding: 0.25rem 0.75rem !important;
          /* Critical: 16px font-size prevents iOS Safari zoom on focus */
          font-size: 16px !important;
          line-height: 1.5 !important;
          border-radius: calc(var(--radius) - 2px) !important;
          border: 1px solid hsl(var(--input)) !important;
          background-color: transparent !important;
          background: transparent !important;
          color: hsl(var(--foreground)) !important;
          transition: all 0.2s !important;
          outline: none !important;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
          -webkit-appearance: none !important;
          appearance: none !important;
          /* Prevent text size adjustment which can cause zoom */
          -webkit-text-size-adjust: 100% !important;
          -moz-text-size-adjust: 100% !important;
          -ms-text-size-adjust: 100% !important;
          text-size-adjust: 100% !important;
          /* Prevent tap highlight on mobile */
          -webkit-tap-highlight-color: transparent !important;
          /* Ensure touch-action doesn't interfere */
          touch-action: manipulation !important;
        }

        /* Mobile-specific adjustments */
        @media (max-width: 768px) {
          gmp-place-autocomplete input {
            /* Ensure 16px minimum on mobile to prevent zoom */
            font-size: max(16px, 1rem) !important;
          }
        }

        /* Placeholder styling */
        gmp-place-autocomplete input::placeholder,
        gmp-place-autocomplete input::-webkit-input-placeholder {
          color: hsl(var(--muted-foreground)) !important;
          opacity: 1 !important;
        }

        /* Focus state */
        gmp-place-autocomplete input:focus,
        gmp-place-autocomplete input:focus-visible {
          border-color: hsl(var(--ring)) !important;
          box-shadow: 0 0 0 3px hsl(var(--ring) / 0.5) !important;
          outline: none !important;
        }

        /* Disabled state */
        gmp-place-autocomplete input:disabled {
          cursor: not-allowed !important;
          opacity: 0.5 !important;
        }

        /* Override any dark background from Google */
        gmp-place-autocomplete > div,
        gmp-place-autocomplete .gm-control-active {
          background-color: transparent !important;
          background: transparent !important;
        }

        /* Style the dropdown suggestions */
        .pac-container {
          border-radius: calc(var(--radius) - 2px) !important;
          border: 1px solid hsl(var(--border)) !important;
          background-color: hsl(var(--background)) !important;
          background: hsl(var(--background)) !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
          margin-top: 4px !important;
          font-family: inherit !important;
        }

        .pac-item {
          color: hsl(var(--foreground)) !important;
          background-color: hsl(var(--background)) !important;
          border-color: hsl(var(--border)) !important;
          padding: 0.5rem 0.75rem !important;
          font-size: 0.875rem !important;
          cursor: pointer !important;
          line-height: 1.5 !important;
        }

        .pac-item:hover {
          background-color: hsl(var(--accent)) !important;
        }

        .pac-item-selected {
          background-color: hsl(var(--accent)) !important;
        }

        .pac-item-query {
          color: hsl(var(--foreground)) !important;
          font-size: 0.875rem !important;
        }

        .pac-matched {
          font-weight: 600 !important;
          color: hsl(var(--foreground)) !important;
        }

      `}</style>
      <div className="space-y-2">
        <Label>Restaurant Name</Label>
        <div ref={containerRef} className="w-full" />
        <p className="text-xs text-muted-foreground">
          Select from suggestions
        </p>
      </div>
    </>
  )
}
