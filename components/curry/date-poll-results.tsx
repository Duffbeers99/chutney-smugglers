"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { BarChart3, Trophy, Users } from "lucide-react"
import { format } from "date-fns"

interface DatePollResultsProps {
  className?: string
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

  // Get the top vote count for highlighting the winner
  const topVoteCount = voteSummary[0]?.count || 0

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
          {voteSummary.map((item, index) => {
            const isTopVote = item.count === topVoteCount
            const dateStr = format(new Date(item.date), "EEEE, MMMM d, yyyy")

            return (
              <div
                key={item.date}
                className={cn(
                  "relative rounded-lg border p-3 transition-all",
                  isTopVote && index === 0
                    ? "bg-saffron-gold/5 border-saffron-gold/30 shadow-sm"
                    : "bg-background/50"
                )}
              >
                {isTopVote && index === 0 && (
                  <div className="absolute -top-2 -right-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-saffron-gold shadow-sm">
                      <Trophy className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{dateStr}</span>
                    {isTopVote && index === 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-saffron-gold/10 text-saffron-gold border-saffron-gold/20 text-xs"
                      >
                        Most Popular
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "font-semibold",
                      isTopVote && index === 0
                        ? "bg-saffron-gold/10 text-saffron-gold border-saffron-gold/30"
                        : ""
                    )}
                  >
                    {item.count} {item.count === 1 ? "vote" : "votes"}
                  </Badge>
                </div>

                {/* User avatars */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.users.map((user) => {
                    const displayName = user.nickname || user.name || "User"
                    const initials = displayName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)

                    return (
                      <div key={user._id} className="flex items-center gap-1.5">
                        <Avatar className="h-6 w-6 border border-border">
                          {user.profileImageId && storageUrl ? (
                            <AvatarImage
                              src={`${storageUrl}/api/storage/${user.profileImageId}`}
                              alt={displayName}
                            />
                          ) : null}
                          <AvatarFallback className="text-[10px]">
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
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground text-center">
          Total: {voteSummary.reduce((sum, item) => sum + item.count, 0)} votes across{" "}
          {voteSummary.length} {voteSummary.length === 1 ? "date" : "dates"}
        </div>
      </CardContent>
    </Card>
  )
}
