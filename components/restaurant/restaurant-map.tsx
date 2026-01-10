"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createRoot } from "react-dom/client"
import { Loader2, AlertCircle } from "lucide-react"
import { useGoogleMaps } from "@/hooks/use-google-maps"
import { RestaurantMarkerInfo } from "./restaurant-marker-info"

interface Restaurant {
  _id: string
  name: string
  address: string
  cuisine?: string
  location: {
    lat: number
    lng: number
  }
  totalRatings: number
  overallAverage?: number
  hasSoloMissions?: boolean
  soloMissionAverage?: number | null
}

interface RestaurantMapProps {
  restaurants: Restaurant[]
  isPublicView?: boolean
}

export function RestaurantMap({ restaurants, isPublicView = false }: RestaurantMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const router = useRouter()

  const { isLoaded, loadError } = useGoogleMaps(["maps", "marker"])

  useEffect(() => {
    if (!isLoaded || !mapRef.current || restaurants.length === 0) return

    // Initialize map
    const map = new google.maps.Map(mapRef.current, {
      center: { lat: 51.5074, lng: -0.1278 }, // Default to London
      zoom: 12,
      mapId: "restaurant-map", // Required for Advanced Markers
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })

    mapInstanceRef.current = map

    // Create bounds to fit all markers
    const bounds = new google.maps.LatLngBounds()

    // Create info window (reuse for all markers)
    const infoWindow = new google.maps.InfoWindow()
    infoWindowRef.current = infoWindow

    // Clear existing markers
    markersRef.current.forEach((marker) => (marker.map = null))
    markersRef.current = []

    // Create markers for each restaurant
    restaurants.forEach((restaurant) => {
      const position = {
        lat: restaurant.location.lat,
        lng: restaurant.location.lng,
      }

      // Create custom marker content - gold for solo missions, orange for group events
      const markerColor = restaurant.hasSoloMissions
        ? "oklch(0.75 0.15 85)" // Gold for solo missions
        : "oklch(0.72 0.18 35)" // Orange for group events
      const strokeColor = restaurant.hasSoloMissions
        ? "oklch(0.45 0.10 85)" // Darker gold stroke
        : "oklch(0.25 0.05 35)" // Darker orange stroke

      const markerContent = document.createElement("div")
      markerContent.className = "relative"
      markerContent.innerHTML = `
        <div class="relative">
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z" fill="${markerColor}" stroke="${strokeColor}" stroke-width="2"/>
            <circle cx="16" cy="16" r="6" fill="white"/>
          </svg>
        </div>
      `

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: markerContent,
        title: restaurant.name,
      })

      // Add marker click listener
      marker.addListener("click", () => {
        // Create info window content
        const infoContent = document.createElement("div")
        const root = createRoot(infoContent)
        root.render(<RestaurantMarkerInfo restaurant={restaurant} />)

        // Set content and open info window
        infoWindow.setContent(infoContent)
        infoWindow.open(map, marker)

        // Add click listener to info window to navigate to detail page
        google.maps.event.addListenerOnce(infoWindow, "domready", () => {
          const infoWindowElement = infoContent.parentElement
          if (infoWindowElement) {
            infoWindowElement.style.cursor = "pointer"
            infoWindowElement.addEventListener("click", () => {
              const detailPath = isPublicView
                ? `/view/restaurants/${restaurant._id}`
                : `/restaurants/${restaurant._id}`
              router.push(detailPath)
            })
          }
        })
      })

      markersRef.current.push(marker)
      bounds.extend(position)
    })

    // Fit map to show all markers
    if (restaurants.length > 0) {
      map.fitBounds(bounds)

      // Add some padding to the bounds
      const listener = google.maps.event.addListenerOnce(map, "bounds_changed", () => {
        const currentZoom = map.getZoom()
        if (currentZoom && currentZoom > 15) {
          map.setZoom(15) // Don't zoom in too much for single marker
        }
      })
    }

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => (marker.map = null))
      markersRef.current = []
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
      }
    }
  }, [isLoaded, restaurants, router])

  if (loadError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="font-semibold text-foreground mb-2">Failed to load map</h3>
        <p className="text-sm text-muted-foreground">
          {loadError.message}
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading map...</p>
      </div>
    )
  }

  if (restaurants.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <h3 className="font-semibold text-foreground mb-2">No restaurants to display</h3>
        <p className="text-sm text-muted-foreground">
          Restaurants need location data to appear on the map.
        </p>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full"
      style={{ minHeight: "400px" }}
    />
  )
}
