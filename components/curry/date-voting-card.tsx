"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { CalendarDays } from "lucide-react"
import { startOfMonth, addMonths, endOfMonth } from "date-fns"
import { toast } from "sonner"

interface DateVotingCardProps {
  className?: string
}

export function DateVotingCard({ className }: DateVotingCardProps) {
  const userVotes = useQuery(api.dateVotes.getUserVotes)
  const toggleVote = useMutation(api.dateVotes.toggleDateVote)

  // Calculate next month's date range
  const now = new Date()
  const nextMonth = addMonths(now, 1)
  const startOfNextMonth = startOfMonth(nextMonth)
  const endOfNextMonth = endOfMonth(nextMonth)

  // Convert user votes (timestamps) to Date objects for the calendar
  const selectedDates = React.useMemo(() => {
    if (!userVotes) return []
    return userVotes.map((timestamp) => new Date(timestamp))
  }, [userVotes])

  // Normalize a date to midnight UTC to avoid local timezone drift
  const toUTCMidnight = (date: Date): number => {
    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  }

  const handleDateSelect = async (dates: Date[] | undefined) => {
    if (!dates) return

    // Find which date was toggled (use UTC midnight to match server storage)
    const newDateSet = new Set(dates.map((d) => toUTCMidnight(d)))
    const oldDateSet = new Set(userVotes || [])

    // Find added date
    const addedDate = dates.find(
      (d) => !oldDateSet.has(toUTCMidnight(d))
    )
    // Find removed date
    const removedDate = (userVotes || []).find(
      (timestamp) => !newDateSet.has(timestamp)
    )

    const dateToToggle = addedDate
      ? toUTCMidnight(addedDate)
      : removedDate

    if (!dateToToggle) return

    try {
      const result = await toggleVote({ date: dateToToggle })

      if (result.action === "added") {
        toast.success("Date added to your availability")
      } else {
        toast.success("Date removed from your availability")
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update vote")
    }
  }

  // Disable dates outside next month
  const disabledDates = (date: Date) => {
    return date < startOfNextMonth || date > endOfNextMonth
  }

  return (
    <Card className={cn("card-parchment", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-curry-orange/10">
            <CalendarDays className="h-4 w-4 text-curry-orange" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Vote for Next Curry</h3>
            <p className="text-xs text-muted-foreground">
              Select all dates you&apos;re available
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Calendar
            mode="multiple"
            selected={selectedDates}
            onSelect={handleDateSelect}
            disabled={disabledDates}
            month={startOfNextMonth}
            className="rounded-md border"
            classNames={{
              months: "flex flex-col",
              month: "space-y-4",
              nav: "flex items-center justify-between mb-4",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: cn(
                "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
                "first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
              ),
              day_selected: "bg-curry-orange text-white hover:bg-curry-orange/90 hover:text-white focus:bg-curry-orange/90 focus:text-white",
              day_today: "bg-accent text-accent-foreground font-semibold",
              day_outside: "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
              day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
              day_hidden: "invisible",
            }}
          />
        </div>
        <div className="text-xs text-muted-foreground text-center">
          {selectedDates.length === 0 ? (
            <span>Select dates you can attend</span>
          ) : (
            <span className="text-curry-orange font-medium">
              {selectedDates.length} date{selectedDates.length === 1 ? "" : "s"} selected
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
