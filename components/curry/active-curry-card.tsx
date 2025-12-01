"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { useRouter } from "next/navigation"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Star, Check, X, Users } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Id } from "@/convex/_generated/dataModel"

interface ActiveCurryCardProps {
  className?: string
}

export function ActiveCurryCard({ className }: ActiveCurryCardProps) {
  const router = useRouter()
  const activeEvent = useQuery(api.curryEvents.getActiveEvent)
  const currentUser = useQuery(api.users.currentUser)
  const canManage = useQuery(api.curryEvents.canManageEvents)
  const attendees = useQuery(
    api.curryEvents.getEventAttendees,
    activeEvent ? { eventId: activeEvent._id } : "skip"
  )

  const revealRatings = useMutation(api.curryEvents.revealEventRatings)
  const [isRevealing, setIsRevealing] = React.useState(false)

  // Loading state
  if (activeEvent === undefined || currentUser === undefined || attendees === undefined) {
    return (
      <Card className={cn("card-parchment mx-4", className)}>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    )
  }

  // No active event
  if (!activeEvent) {
    return null
  }

  const eventDate = new Date(activeEvent.scheduledDate)
  const hasVoted = activeEvent.hasVoted?.includes(currentUser._id) || false
  const isAttending = attendees.some((a) => a._id === currentUser._id)

  // Count who has voted vs total attendees
  const votedCount = activeEvent.hasVoted?.length || 0
  const totalAttendees = attendees.length
  const allVoted = votedCount === totalAttendees && totalAttendees > 0
  const ratingsRevealed = activeEvent.ratingsRevealed || false

  // Handle revealing ratings
  const handleRevealRatings = async () => {
    setIsRevealing(true)
    try {
      await revealRatings({ eventId: activeEvent._id })
      toast.success("Ratings revealed!")
    } catch (error) {
      console.error("Failed to reveal ratings:", error)
      toast.error(error instanceof Error ? error.message : "Failed to reveal ratings")
    } finally {
      setIsRevealing(false)
    }
  }

  // Navigate to rating submission
  const handleSubmitRating = () => {
    router.push(`/add-rating?eventId=${activeEvent._id}`)
  }

  return (
    <Card className={cn("card-parchment mx-4 border-l-4",
      ratingsRevealed ? "border-l-green-500" : "border-l-curry",
      className
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant={ratingsRevealed ? "default" : "secondary"} className={cn(
              ratingsRevealed ? "bg-green-500" : "bg-curry/10 text-curry border-curry/20"
            )}>
              {ratingsRevealed ? "Completed" : "Active"}
            </Badge>
            {!ratingsRevealed && (
              <span className="text-xs text-muted-foreground">
                {votedCount} of {totalAttendees} voted
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-foreground">
            {activeEvent.restaurantName}
          </h3>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            <span className="truncate">{activeEvent.address}</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="size-3" />
              <span>{format(eventDate, "MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="size-3" />
              <span>{activeEvent.scheduledTime}</span>
            </div>
          </div>
        </div>

        {/* Attendees and Voting Status */}
        {!ratingsRevealed && totalAttendees > 0 && (
          <div className="pt-3 border-t border-border space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
              <Users className="size-3" />
              <span>Attendees ({totalAttendees})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {attendees.map((attendee) => {
                const voted = activeEvent.hasVoted?.includes(attendee._id)
                return (
                  <div
                    key={attendee._id}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50"
                  >
                    <Avatar className="size-5 border border-border">
                      {attendee.profileImageUrl && (
                        <AvatarImage
                          src={attendee.profileImageUrl}
                          alt={attendee.nickname || "User"}
                        />
                      )}
                      <AvatarFallback className="bg-curry/20 text-curry text-[9px]">
                        {attendee.nickname?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">
                      {attendee.nickname || "Unknown"}
                    </span>
                    {voted ? (
                      <Check className="size-3 text-green-500" />
                    ) : (
                      <X className="size-3 text-muted-foreground" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA Section */}
        {!ratingsRevealed && (
          <div className="pt-3 border-t border-border space-y-3">
            {isAttending ? (
              <>
                {!hasVoted ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Rate this curry to reveal the results!
                    </p>
                    <Button
                      onClick={handleSubmitRating}
                      className="w-full curry-gradient text-white"
                      size="lg"
                    >
                      <Star className="size-4 mr-2" />
                      Submit Your Rating
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <Check className="size-5 text-green-600 dark:text-green-400 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100">
                        You've submitted your rating!
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        {allVoted
                          ? "All attendees have voted. Ratings will be revealed shortly."
                          : `Waiting for ${totalAttendees - votedCount} more ${totalAttendees - votedCount === 1 ? 'person' : 'people'}.`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Admin override */}
                {canManage && !allVoted && hasVoted && (
                  <Button
                    onClick={handleRevealRatings}
                    disabled={isRevealing}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                  >
                    {isRevealing ? "Revealing..." : "Reveal Ratings (Override)"}
                  </Button>
                )}
              </>
            ) : (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground text-center">
                  You didn't attend this curry
                </p>
              </div>
            )}
          </div>
        )}

        {/* Completed State */}
        {ratingsRevealed && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <Check className="size-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Ratings revealed!
                </p>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Check the leaderboards and restaurant page for results.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
