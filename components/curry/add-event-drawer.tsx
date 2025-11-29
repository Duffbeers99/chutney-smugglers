"use client"

import * as React from "react"
import { useMutation } from "convex/react"
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

  // Form state
  const [restaurantName, setRestaurantName] = React.useState(existingEvent?.restaurantName ?? "")
  const [address, setAddress] = React.useState(existingEvent?.address ?? "")
  const [date, setDate] = React.useState<Date | undefined>(
    existingEvent ? new Date(existingEvent.scheduledDate) : undefined
  )
  const [time, setTime] = React.useState(existingEvent?.scheduledTime ?? "19:00")
  const [notes, setNotes] = React.useState(existingEvent?.notes ?? "")
  const [loading, setLoading] = React.useState(false)

  const createEventMutation = useMutation(api.curryEvents.createEvent)
  const updateEventMutation = useMutation(api.curryEvents.updateEvent)
  const addRestaurant = useMutation(api.restaurants.add)

  // Reset form when drawer closes (only for create mode)
  React.useEffect(() => {
    if (!open && !existingEvent) {
      setTimeout(() => {
        setRestaurantName("")
        setAddress("")
        setDate(undefined)
        setTime("19:00")
        setNotes("")
      }, 300) // Wait for sheet animation to complete
    }
  }, [open, existingEvent])

  // Populate form when opening in edit mode OR switching to create mode
  React.useEffect(() => {
    if (open) {
      if (existingEvent) {
        // Edit mode - populate with existing data
        setRestaurantName(existingEvent.restaurantName)
        setAddress(existingEvent.address)
        setDate(new Date(existingEvent.scheduledDate))
        setTime(existingEvent.scheduledTime)
        setNotes(existingEvent.notes ?? "")
      } else {
        // Create mode - ensure clean form
        setRestaurantName("")
        setAddress("")
        setDate(undefined)
        setTime("19:00")
        setNotes("")
      }
    }
  }, [open, existingEvent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!restaurantName.trim()) {
      toast.error("Please enter a restaurant name")
      return
    }

    if (!address.trim()) {
      toast.error("Please enter an address")
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

    setLoading(true)

    try {
      // Create a date at midnight for the selected day
      const scheduledDate = new Date(date)
      scheduledDate.setHours(0, 0, 0, 0)

      if (isEditing && existingEvent) {
        // For editing, we don't create a new restaurant, just update the event
        await updateEventMutation({
          eventId: existingEvent._id,
          restaurantName: restaurantName.trim(),
          address: address.trim(),
          scheduledDate: scheduledDate.getTime(),
          scheduledTime: time,
          notes: notes.trim() || undefined,
        })

        toast.success("Curry event updated!")
      } else {
        // For creating, first add the restaurant, then create the event
        const restaurantId = await addRestaurant({
          name: restaurantName.trim(),
          address: address.trim(),
        })

        await createEventMutation({
          restaurantId,
          restaurantName: restaurantName.trim(),
          address: address.trim(),
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
      <SheetContent
        side="bottom"
        className="h-[90vh] max-h-[90vh] rounded-t-3xl overflow-hidden flex flex-col p-0"
      >
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <SheetHeader>
            <SheetTitle className="text-xl">
              {isEditing ? "Edit Curry Event" : "Add Next Curry Event"}
            </SheetTitle>
            <SheetDescription>
              Enter the details for the upcoming curry night
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="event-form" onSubmit={handleSubmit} className="space-y-5">
            {/* Restaurant Name */}
            <div className="space-y-2">
              <Label htmlFor="restaurant-name">Restaurant Name</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="restaurant-name"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g., Spice Garden"
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 123 Curry Lane, London"
                required
                disabled={loading}
              />
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    disabled={loading}
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
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                disabled={loading}
              />
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
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {notes.length}/500 characters
              </p>
            </div>
          </form>
        </div>

        {/* Fixed footer with actions */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border bg-background">
          <div className="flex gap-3">
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
              form="event-form"
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
