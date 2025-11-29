"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { Calendar as CalendarIcon, Clock, Loader2, MapPin } from "lucide-react"
import { RestaurantSearch } from "./restaurant-search"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface AddEventDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingEvent?: {
    _id: Id<"curryEvents">
    restaurantId: Id<"restaurants">
    restaurantName: string
    address: string
    scheduledDate: number
    scheduledTime: string
    notes?: string
  }
}

export function AddEventDrawer({ open, onOpenChange, existingEvent }: AddEventDrawerProps) {
  const isEditing = !!existingEvent

  const [step, setStep] = React.useState<"search" | "details">(
    isEditing ? "details" : "search"
  )
  const [selectedRestaurantId, setSelectedRestaurantId] = React.useState<Id<"restaurants"> | null>(
    existingEvent?.restaurantId ?? null
  )
  const [date, setDate] = React.useState<Date | undefined>(
    existingEvent ? new Date(existingEvent.scheduledDate) : undefined
  )
  const [time, setTime] = React.useState(existingEvent?.scheduledTime ?? "19:00")
  const [notes, setNotes] = React.useState(existingEvent?.notes ?? "")
  const [loading, setLoading] = React.useState(false)

  const createEvent = useMutation(api.curryEvents.createEvent)
  const updateEvent = useMutation(api.curryEvents.updateEvent)
  const selectedRestaurant = useQuery(
    api.restaurants.get,
    selectedRestaurantId ? { id: selectedRestaurantId } : "skip"
  )

  // Reset form when drawer closes
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        if (!existingEvent) {
          setStep("search")
          setSelectedRestaurantId(null)
          setDate(undefined)
          setTime("19:00")
          setNotes("")
        }
      }, 300) // Wait for sheet animation to complete
    }
  }, [open, existingEvent])

  // Update form when existingEvent changes
  React.useEffect(() => {
    if (existingEvent) {
      setStep("details")
      setSelectedRestaurantId(existingEvent.restaurantId)
      setDate(new Date(existingEvent.scheduledDate))
      setTime(existingEvent.scheduledTime)
      setNotes(existingEvent.notes ?? "")
    }
  }, [existingEvent])

  const handleRestaurantSelect = (restaurantId: Id<"restaurants">) => {
    setSelectedRestaurantId(restaurantId)
    setStep("details")
  }

  const handleBack = () => {
    if (!isEditing) {
      setStep("search")
      setSelectedRestaurantId(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedRestaurantId) {
      toast.error("Please select a restaurant")
      return
    }

    if (!date) {
      toast.error("Please select a date")
      return
    }

    if (!time) {
      toast.error("Please enter a time")
      return
    }

    if (!selectedRestaurant) {
      toast.error("Restaurant data not loaded")
      return
    }

    setLoading(true)

    try {
      // Create a date at midnight for the selected day
      const scheduledDate = new Date(date)
      scheduledDate.setHours(0, 0, 0, 0)

      if (isEditing && existingEvent) {
        await updateEvent({
          eventId: existingEvent._id,
          restaurantId: selectedRestaurantId,
          restaurantName: selectedRestaurant.name,
          address: selectedRestaurant.address,
          scheduledDate: scheduledDate.getTime(),
          scheduledTime: time,
          notes: notes.trim() || undefined,
        })

        toast.success("Curry event updated!")
      } else {
        await createEvent({
          restaurantId: selectedRestaurantId,
          restaurantName: selectedRestaurant.name,
          address: selectedRestaurant.address,
          scheduledDate: scheduledDate.getTime(),
          scheduledTime: time,
          notes: notes.trim() || undefined,
        })

        toast.success("Curry event created!")
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save event:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save event")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isEditing ? "Edit Curry Event" : "Add Next Curry Event"}
          </SheetTitle>
          <SheetDescription>
            {step === "search"
              ? "Search for a curry house or add a new one"
              : "Enter the details for the upcoming curry"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6">
          {step === "search" && (
            <RestaurantSearch onSelect={handleRestaurantSelect} />
          )}

          {step === "details" && selectedRestaurant && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selected Restaurant Display */}
              <div className="p-4 rounded-lg border border-border bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full curry-gradient shrink-0">
                    <MapPin className="size-5 text-white" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {selectedRestaurant.name}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {selectedRestaurant.address}
                    </p>
                    {!isEditing && (
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={handleBack}
                        className="h-auto p-0 mt-1 text-xs"
                      >
                        Change restaurant
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Date Picker */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Input */}
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {/* Notes (Optional) */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special details about this curry night..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {notes.length}/500 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 curry-gradient text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : isEditing ? (
                    "Update Event"
                  ) : (
                    "Create Event"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
