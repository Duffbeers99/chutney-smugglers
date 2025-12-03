"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Calendar, Clock, MapPin, Flame, Plus, Pencil, Trash2, Check, Users } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AddEventDrawer } from "./add-event-drawer"
import type { Id } from "@/convex/_generated/dataModel"

interface UpcomingCurryCardProps {
  className?: string
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isPast: boolean
}

function calculateTimeRemaining(scheduledDate: number, scheduledTime: string): TimeRemaining {
  // Parse the scheduled time (HH:mm format)
  const [timeHours, timeMinutes] = scheduledTime.split(":").map(Number)

  // Create a date object with the scheduled date and time
  const eventDate = new Date(scheduledDate)
  eventDate.setHours(timeHours, timeMinutes, 0, 0)

  const now = Date.now()
  const diff = eventDate.getTime() - now

  if (diff < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  return { days, hours, minutes, seconds, isPast: false }
}

export function UpcomingCurryCard({ className }: UpcomingCurryCardProps) {
  const nextEvent = useQuery(api.curryEvents.getNextEvent)
  const canManage = useQuery(api.curryEvents.canManageEvents)
  const currentUser = useQuery(api.users.currentUser)
  const currentBooker = useQuery(api.curryEvents.getCurrentBooker)
  const attendees = useQuery(
    api.curryEvents.getEventAttendees,
    nextEvent ? { eventId: nextEvent._id } : "skip"
  )

  const deleteEvent = useMutation(api.curryEvents.deleteEvent)
  const confirmAttendance = useMutation(api.curryEvents.confirmAttendance)
  const cancelAttendance = useMutation(api.curryEvents.cancelAttendance)

  const [timeRemaining, setTimeRemaining] = React.useState<TimeRemaining | null>(null)
  const [isAddDrawerOpen, setIsAddDrawerOpen] = React.useState(false)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = React.useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isTogglingAttendance, setIsTogglingAttendance] = React.useState(false)

  // Update countdown with live ticking
  React.useEffect(() => {
    if (!nextEvent) {
      setTimeRemaining(null)
      return
    }

    const updateCountdown = () => {
      const remaining = calculateTimeRemaining(nextEvent.scheduledDate, nextEvent.scheduledTime)
      setTimeRemaining(remaining)
    }

    // Update immediately
    updateCountdown()

    // Always update every second for live countdown
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [nextEvent])

  // Handle delete confirmation
  const confirmDelete = async () => {
    if (!nextEvent) return

    setIsDeleting(true)
    try {
      await deleteEvent({ eventId: nextEvent._id })
      toast.success("Curry event deleted")
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Failed to delete event:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete event")
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle attendance toggle
  const toggleAttendance = async (checked: boolean) => {
    if (!nextEvent || !currentUser) return

    setIsTogglingAttendance(true)
    try {
      if (checked) {
        await confirmAttendance({ eventId: nextEvent._id })
        toast.success("Attendance confirmed!")
      } else {
        await cancelAttendance({ eventId: nextEvent._id })
        toast.success("Attendance cancelled")
      }
    } catch (error) {
      console.error("Failed to toggle attendance:", error)
      toast.error(error instanceof Error ? error.message : "Failed to update attendance")
    } finally {
      setIsTogglingAttendance(false)
    }
  }

  // Check if current user is attending
  const isAttending = Boolean(currentUser && attendees?.some((a) => a._id === currentUser._id))

  // Loading state
  if (nextEvent === undefined || canManage === undefined) {
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

  // No event exists - show different views for current booker vs others
  if (!nextEvent) {
    // Check if current user is the booker
    const isCurrentBooker = currentBooker && currentUser && currentBooker.user?._id === currentUser._id
    const bookerName = currentBooker?.user?.nickname || currentBooker?.user?.name || "Someone"
    const bookerImageUrl = currentBooker?.user?.profileImageId
      ? `${process.env.NEXT_PUBLIC_CONVEX_URL}/api/storage/${currentBooker.user.profileImageId}`
      : null

    return (
      <>
        <Card className={cn(
          "card-parchment mx-4 relative overflow-hidden",
          isCurrentBooker ? "border-2 border-saffron-gold/50" : "border-2 border-curry/30",
          className
        )}>
          {/* Abstract Indian flag colors background */}
          <div className="absolute inset-0 pointer-events-none opacity-30">
            {/* Saffron orange blobs */}
            <div
              className="absolute rounded-full blur-2xl"
              style={{
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, #FF9933 0%, transparent 70%)',
                top: '-50px',
                left: '-30px',
              }}
            />
            <div
              className="absolute rounded-full blur-xl"
              style={{
                width: '150px',
                height: '150px',
                background: 'radial-gradient(circle, #FF9933 0%, transparent 70%)',
                bottom: '20px',
                right: '-20px',
              }}
            />

            {/* White/light blobs */}
            <div
              className="absolute rounded-full blur-2xl"
              style={{
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Green blobs */}
            <div
              className="absolute rounded-full blur-2xl"
              style={{
                width: '160px',
                height: '160px',
                background: 'radial-gradient(circle, #138808 0%, transparent 70%)',
                top: '-20px',
                right: '10px',
              }}
            />
            <div
              className="absolute rounded-full blur-xl"
              style={{
                width: '140px',
                height: '140px',
                background: 'radial-gradient(circle, #138808 0%, transparent 70%)',
                bottom: '-30px',
                left: '30%',
              }}
            />
          </div>

          <CardContent className="flex flex-col items-center justify-center text-center gap-4 p-6 relative z-10">
            {/* Profile Picture */}
            <Avatar className={cn(
              "border-4 shadow-lg",
              isCurrentBooker ? "size-24 border-saffron-gold" : "size-16 border-curry"
            )}>
              {bookerImageUrl && (
                <AvatarImage src={bookerImageUrl} alt={bookerName} />
              )}
              <AvatarFallback className="bg-curry text-curry-foreground font-bold text-2xl">
                {bookerName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* Message */}
            <div className="space-y-2">
              {isCurrentBooker ? (
                <>
                  <p className="text-lg font-bold text-foreground">
                    It&apos;s your turn to book the next curry
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Select a restaurant and schedule the next Chutney Smugglers curry event
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-foreground">
                    No upcoming curry scheduled
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    It is <span className="font-semibold text-foreground">{bookerName}&apos;s</span> turn to book the curry
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    You&apos;ll be notified when it&apos;s your turn
                  </p>
                </>
              )}
            </div>

            {/* Button - only show for current booker */}
            {isCurrentBooker && (
              <Button
                size="lg"
                onClick={() => setIsAddDrawerOpen(true)}
                className="curry-gradient text-white font-semibold"
              >
                <Plus className="size-5 mr-2" />
                Book Next Curry
              </Button>
            )}
          </CardContent>
        </Card>

        <AddEventDrawer
          open={isAddDrawerOpen}
          onOpenChange={setIsAddDrawerOpen}
        />
      </>
    )
  }

  // Event exists but has passed - hide the card
  if (timeRemaining?.isPast) {
    return null
  }

  // Active event with countdown
  const eventDate = new Date(nextEvent.scheduledDate)

  return (
    <>
      <Card className={cn("card-parchment mx-4 border-l-4 border-l-curry", className)}>
        <CardContent className="p-4 space-y-3">
          {/* Header with restaurant name and actions */}
          <div className="flex items-start gap-3">
            <div className="flex size-12 items-center justify-center rounded-full curry-gradient shrink-0">
              <Flame className="size-6 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-base font-bold text-foreground truncate">
                  {nextEvent.restaurantName}
                </h3>
                {canManage && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditDrawerOpen(true)}
                      className="h-7 w-7 p-0"
                    >
                      <Pencil className="size-3.5" />
                      <span className="sr-only">Edit event</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsDeleteDialogOpen(true)}
                      disabled={isDeleting}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete event</span>
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="size-3" aria-hidden="true" />
                <span className="truncate">{nextEvent.address}</span>
              </div>
            </div>
          </div>

          {/* Date and time */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-4 text-curry" aria-hidden="true" />
              <span className="font-medium">{format(eventDate, "EEE, MMM d, yyyy")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-curry" aria-hidden="true" />
              <span className="font-medium">{nextEvent.scheduledTime}</span>
            </div>
          </div>

          {/* Countdown timer */}
          {timeRemaining && !timeRemaining.isPast && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Time until curry:</p>
              <div className="grid grid-cols-4 gap-2">
                <CountdownUnit value={timeRemaining.days} label="Days" />
                <CountdownUnit value={timeRemaining.hours} label="Hours" />
                <CountdownUnit value={timeRemaining.minutes} label="Mins" />
                <CountdownUnit value={timeRemaining.seconds} label="Secs" />
              </div>
            </div>
          )}

          {/* Attendance Section */}
          <div className="pt-3 border-t border-border space-y-3">
            {/* Attendance Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={isAttending}
                onCheckedChange={toggleAttendance}
                disabled={isTogglingAttendance || !currentUser}
                className="data-[state=checked]:bg-curry data-[state=checked]:border-curry"
              />
              <span className="text-sm font-medium text-foreground">
                I'm attending this curry
              </span>
            </label>

            {/* Attendees List */}
            {attendees && attendees.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="size-3" />
                  <span>{attendees.length} {attendees.length === 1 ? 'person' : 'people'} attending</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {attendees.map((attendee) => (
                    <div key={attendee._id} className="flex items-center gap-1.5 text-xs">
                      <Avatar className="size-6 border border-border">
                        {attendee.profileImageUrl && (
                          <AvatarImage
                            src={attendee.profileImageUrl}
                            alt={attendee.nickname || "User"}
                          />
                        )}
                        <AvatarFallback className="bg-curry/20 text-curry text-[10px]">
                          {attendee.nickname?.charAt(0)?.toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-foreground">
                        {attendee.nickname || "Unknown"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Optional notes */}
          {nextEvent.notes && (
            <p className="text-xs text-muted-foreground italic pt-2 border-t border-border">
              {nextEvent.notes}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit drawer */}
      {canManage && (
        <AddEventDrawer
          open={isEditDrawerOpen}
          onOpenChange={setIsEditDrawerOpen}
          existingEvent={nextEvent}
        />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Curry Event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this curry event? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-muted/50 rounded-lg p-2">
      <span className="text-lg font-bold text-curry tabular-nums">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
    </div>
  )
}
