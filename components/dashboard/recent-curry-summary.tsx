"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PriceDisplay } from "@/components/ui/price-display"
import { Star } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { Id } from "@/convex/_generated/dataModel"

export function RecentCurrySummary() {
  const recentCurry = useQuery(api.curryEvents.getMostRecentCompletedCurry)

  if (!recentCurry) {
    return null
  }

  // Extract short quote highlights from notes (2-3 quotes, 15-30 words each)
  const noteHighlights = recentCurry.ratings
    .filter((r) => r.notes && r.notes.trim().length > 0)
    .map((r) => {
      const fullNote = r.notes!
      // Try to extract a meaningful snippet
      let snippet = fullNote

      // If note is longer than 100 characters, try to extract a good snippet
      if (fullNote.length > 100) {
        // Split by sentences (periods, exclamation marks, question marks)
        const sentences = fullNote.split(/[.!?]+/).filter((s) => s.trim().length > 0)

        // Find the first interesting sentence (prefer ones with adjectives or emotion words)
        const interestingSentence = sentences.find((s) =>
          s.length > 20 && s.length < 150 &&
          (/delicious|amazing|incredible|fantastic|excellent|great|good|wonderful|lovely|perfect|terrible|awful|poor|bad|disappointing|bland/i.test(s) ||
           /loved|enjoyed|recommend|impressed|surprised/i.test(s))
        )

        if (interestingSentence) {
          snippet = interestingSentence.trim()
          // Add ellipsis if this is mid-text
          const indexInOriginal = fullNote.indexOf(interestingSentence)
          if (indexInOriginal > 0) {
            snippet = "..." + snippet
          }
          if (indexInOriginal + interestingSentence.length < fullNote.length - 5) {
            snippet = snippet + "..."
          }
        } else if (sentences.length > 0) {
          // Just take the first sentence if no interesting one found
          snippet = sentences[0].trim()
          if (snippet.length > 100) {
            // Truncate to ~80 characters at a word boundary
            const words = snippet.split(" ")
            let truncated = ""
            for (const word of words) {
              if ((truncated + word).length > 80) break
              truncated += (truncated ? " " : "") + word
            }
            snippet = truncated + "..."
          } else if (sentences.length > 1) {
            snippet = snippet + "..."
          }
        }
      }

      // Final safety truncation if still too long
      if (snippet.length > 150) {
        const words = snippet.split(" ")
        let truncated = ""
        for (const word of words) {
          if ((truncated + word).length > 140) break
          truncated += (truncated ? " " : "") + word
        }
        snippet = truncated + "..."
      }

      return {
        userId: r.userId,
        userName: r.userName,
        profileImageUrl: r.profileImageUrl,
        snippet,
      }
    })
    .slice(0, 3) // Take only first 3 highlights

  // Format the date
  const eventDate = new Date(recentCurry.scheduledDate)
  const formattedDate = format(eventDate, "EEEE, MMMM d, yyyy")

  return (
    <Card className="card-parchment">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Latest Curry Review</span>
          <Link
            href={`/restaurants/${recentCurry.restaurantId}`}
            className="text-sm font-normal text-primary hover:underline"
          >
            View Details
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Restaurant name and date */}
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {recentCurry.restaurantName}
          </h3>
          <p className="text-sm text-muted-foreground">{formattedDate}</p>
        </div>

        {/* Overall score */}
        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <Star className="h-6 w-6 fill-primary text-primary" />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {recentCurry.averages.total.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/25</span>
            </div>
            <p className="text-xs text-muted-foreground">
              From {recentCurry.totalRatings} {recentCurry.totalRatings === 1 ? "rating" : "ratings"}
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="grid grid-cols-2 gap-2">
          <CategoryScore
            label="Food"
            value={recentCurry.averages.food}
            emoji="🍛"
          />
          <CategoryScore
            label="Service"
            value={recentCurry.averages.service}
            emoji="👨‍🍳"
          />
          <CategoryScore
            label="Extras"
            value={recentCurry.averages.extras}
            emoji="🥘"
          />
          <CategoryScore
            label="Atmosphere"
            value={recentCurry.averages.atmosphere}
            emoji="🪔"
          />
          {recentCurry.averages.price && (
            <div className="col-span-2 flex items-center gap-2 p-2 bg-muted/30 rounded justify-center">
              <span className="text-lg">💰</span>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Price:</p>
                <PriceDisplay level={recentCurry.averages.price} size="sm" />
              </div>
            </div>
          )}
        </div>

        {/* Note highlights */}
        {noteHighlights.length > 0 && (
          <div className="pt-3 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              What people said
            </h4>
            <div className="space-y-2">
              {noteHighlights.map((highlight) => (
                <div
                  key={highlight.userId}
                  className="flex gap-2 items-start bg-muted/30 rounded-lg p-2"
                >
                  <Avatar className="h-6 w-6 border border-border flex-shrink-0 mt-0.5">
                    {highlight.profileImageUrl && (
                      <AvatarImage
                        src={highlight.profileImageUrl}
                        alt={highlight.userName}
                      />
                    )}
                    <AvatarFallback className="bg-curry/25 text-curry text-xs">
                      {highlight.userName?.charAt(0)?.toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground italic">
                      "{highlight.snippet}"
                    </p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                      - {highlight.userName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CategoryScore({
  label,
  value,
  emoji,
}: {
  label: string
  value: number
  emoji: string
}) {
  const maxScore = label === "Food" ? 10 : 5;
  return (
    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
      <span className="text-lg">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-semibold text-foreground">
          {value.toFixed(1)}<span className="text-xs text-muted-foreground">/{maxScore}</span>
        </p>
      </div>
    </div>
  )
}
