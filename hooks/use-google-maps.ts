"use client"

import { useEffect, useState } from "react"
import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

interface UseGoogleMapsReturn {
  isLoaded: boolean
  loadError: Error | null
}

// Cache promises for each unique set of libraries
const libraryPromises = new Map<string, Promise<any>>()
let optionsSet = false

export function useGoogleMaps(libraries: string[] = ["places"]): UseGoogleMapsReturn {
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

    // Create a unique key for this combination of libraries
    const libraryKey = libraries.sort().join(",")

    // Reuse existing promise if already loading these libraries
    if (!libraryPromises.has(libraryKey)) {
      // Load all requested libraries in parallel
      const loadPromises = libraries.map((lib) => importLibrary(lib))
      libraryPromises.set(libraryKey, Promise.all(loadPromises))
    }

    const promise = libraryPromises.get(libraryKey)!

    promise
      .then(() => {
        setIsLoaded(true)
        setLoadError(null)
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error)
        setLoadError(error)
        libraryPromises.delete(libraryKey) // Remove from cache so we can retry
        optionsSet = false // Reset options too
      })
  }, [libraries.join(",")]) // Depend on libraries array

  return { isLoaded, loadError }
}
