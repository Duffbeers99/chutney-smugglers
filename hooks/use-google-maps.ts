"use client"

import { useEffect, useState } from "react"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

interface UseGoogleMapsReturn {
  isLoaded: boolean
  loadError: Error | null
}

let googleMapsPromise: Promise<any> | null = null
let optionsSet = false

export function useGoogleMaps(): UseGoogleMapsReturn {
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadError, setLoadError] = useState<Error | null>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setLoadError(new Error("Google Maps API key not found"))
      return
    }

    // Set options once globally
    if (!optionsSet) {
      setOptions({
        key: apiKey,
        v: "weekly",
      })
      optionsSet = true
    }

    // Reuse existing promise if already loading
    if (!googleMapsPromise) {
      googleMapsPromise = importLibrary("places")
    }

    googleMapsPromise
      .then(() => {
        setIsLoaded(true)
        setLoadError(null)
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error)
        setLoadError(error)
        googleMapsPromise = null // Reset on error so we can retry
        optionsSet = false // Reset options too
      })
  }, [])

  return { isLoaded, loadError }
}
