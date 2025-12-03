"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { BarChart3, Users } from "lucide-react"
import { format } from "date-fns"

interface DatePollResultsProps {
  className?: string
}

// Generate consistent orange-themed color for each user based on their ID
const getUserColor = (userId: string) => {
  const colors = [
    { border: "border-orange-500", bg: "bg-orange-500/10", text: "text-orange-700" },
    { border: "border-amber-500", bg: "bg-amber-500/10", text: "text-amber-700" },
    { border: "border-red-500", bg: "bg-red-500/10", text: "text-red-700" },
    { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-700" },
    { border: "border-rose-500", bg: "bg-rose-500/10", text: "text-rose-700" },
    { border: "border-orange-600", bg: "bg-orange-600/10", text: "text-orange-800" },
    { border: "border-amber-600", bg: "bg-amber-600/10", text: "text-amber-800" },
    { border: "border-red-600", bg: "bg-red-600/10", text: "text-red-800" },
  ]

  // Generate a consistent index based on userId
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

// Get ordinal suffix for day (1st, 2nd, 3rd, 4th, etc.)
const getOrdinalSuffix = (day: number) => {
  if (day > 3 && day < 21) return "th"
  switch (day % 10) {
    case 1: return "st"
    case 2: return "nd"
    case 3: return "rd"
    default: return "th"
  }
}

// Format date as "Tuesday, 6th January"
const formatDateWithOrdinal = (date: Date) => {
  const dayOfWeek = format(date, "EEEE") // Tuesday
  const day = date.getDate() // 6
  const month = format(date, "MMMM") // January
  return `${dayOfWeek}, ${day}${getOrdinalSuffix(day)} ${month}`
}

// Get medal styling for top 3 positions
const getMedalStyling = (position: number) => {
  switch (position) {
    case 0: // Gold - 1st place
      return {
        bg: "bg-gradient-to-br from-yellow-50/80 to-amber-50/60",
        border: "border-yellow-400/40",
        badgeBg: "bg-yellow-100/80",
        badgeText: "text-yellow-800",
        badgeBorder: "border-yellow-300/50",
      }
    case 1: // Silver - 2nd place
      return {
        bg: "bg-gradient-to-br from-gray-50/80 to-slate-50/60",
        border: "border-gray-400/40",
        badgeBg: "bg-gray-100/80",
        badgeText: "text-gray-800",
        badgeBorder: "border-gray-300/50",
      }
    case 2: // Bronze - 3rd place
      return {
        bg: "bg-gradient-to-br from-orange-50/80 to-amber-50/60",
        border: "border-orange-400/40",
        badgeBg: "bg-orange-100/80",
        badgeText: "text-orange-800",
        badgeBorder: "border-orange-300/50",
      }
    default:
      return {
        bg: "bg-background/50",
        border: "border-border",
        badgeBg: "",
        badgeText: "",
        badgeBorder: "",
      }
  }
}

export function DatePollResults({ className }: DatePollResultsProps) {
  const voteSummary = useQuery(api.dateVotes.getVoteSummary)
  const storageUrl = process.env.NEXT_PUBLIC_CONVEX_URL

  if (!voteSummary || voteSummary.length === 0) {
    return (
      <Card className={cn("card-parchment", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-saffron-gold/10">
              <BarChart3 className="h-4 w-4 text-saffron-gold" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Poll Results</h3>
              <p className="text-xs text-muted-foreground">
                No votes yet
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Start voting for dates to see the most popular options
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Split into top 3 and remaining dates
  const topThree = voteSummary.slice(0, 3)
  const remaining = voteSummary.slice(3)
  const topVoteCount = voteSummary[0]?.count || 0

  // Helper function to render a date item
  const renderDateItem = (item: any, index: number, isInAccordion: boolean = false) => {
    const dateStr = formatDateWithOrdinal(new Date(item.date))

    // Get medal styling for top 3 (only if not in accordion)
    const medalStyle = !isInAccordion && index < 3 ? getMedalStyling(index) : getMedalStyling(-1)
    const isTop3 = !isInAccordion && index < 3
    const isFirstPlace = index === 0 && !isInAccordion

    return (
      <div
        key={item.date}
        className={cn(
          "rounded-lg border p-3 transition-all",
          medalStyle.bg,
          medalStyle.border,
          isTop3 ? "shadow-sm" : ""
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{dateStr}</span>
            {isFirstPlace && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs border",
                  medalStyle.badgeBg,
                  medalStyle.badgeText,
                  medalStyle.badgeBorder
                )}
              >
                Most Popular
              </Badge>
            )}
          </div>
          {/* Only show vote count badge if NOT first place */}
          {!isFirstPlace && (
            <Badge
              variant="outline"
              className={cn(
                "font-semibold",
                isTop3 && medalStyle.badgeBg && medalStyle.badgeText
                  ? `${medalStyle.badgeBg} ${medalStyle.badgeText} ${medalStyle.badgeBorder}`
                  : ""
              )}
            >
              {item.count} {item.count === 1 ? "vote" : "votes"}
            </Badge>
          )}
        </div>

        {/* User avatars */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {item.users.map((user: any) => {
            const displayName = user.nickname || user.name || "User"
            const initials = displayName
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            const colors = getUserColor(user._id)

            return (
              <div key={user._id} className="flex items-center gap-1.5">
                <Avatar className={cn("h-6 w-6 border-2", colors.border)}>
                  {user.profileImageId && storageUrl ? (
                    <AvatarImage
                      src={`${storageUrl}/api/storage/${user.profileImageId}`}
                      alt={displayName}
                    />
                  ) : null}
                  <AvatarFallback className={cn("text-[10px] font-semibold", colors.bg, colors.text)}>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {displayName}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("card-parchment", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-saffron-gold/10">
            <BarChart3 className="h-4 w-4 text-saffron-gold" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Poll Results</h3>
            <p className="text-xs text-muted-foreground">
              Most popular dates
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Top 3 dates */}
          {topThree.map((item, index) => renderDateItem(item, index))}

          {/* Remaining dates in accordion */}
          {remaining.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="more-dates" className="border-none">
                <AccordionTrigger className="py-2 text-sm text-muted-foreground hover:text-foreground">
                  Show {remaining.length} more {remaining.length === 1 ? "date" : "dates"}
                </AccordionTrigger>
                <AccordionContent className="space-y-3 pt-3">
                  {remaining.map((item, index) => renderDateItem(item, index + 3, true))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground text-center">
          Total: {voteSummary.reduce((sum, item) => sum + item.count, 0)} votes across{" "}
          {voteSummary.length} {voteSummary.length === 1 ? "date" : "dates"}
        </div>
      </CardContent>
    </Card>
  )
}
