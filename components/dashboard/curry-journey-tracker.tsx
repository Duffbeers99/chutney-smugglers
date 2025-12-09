"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Plane } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface CurryJourneyTrackerProps {
  curriesCompleted?: number
  goal?: number
  percentage?: number
  isLoading?: boolean
}

export function CurryJourneyTracker({
  curriesCompleted,
  goal = 50,
  percentage = 0,
  isLoading = false,
}: CurryJourneyTrackerProps) {
  if (isLoading) {
    return (
      <Card className="card-parchment mx-4">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="card-parchment mx-4 overflow-hidden">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground font-lora">
              Journey to Mumbai
            </h3>
            <p className="text-sm text-muted-foreground">
              {curriesCompleted} of {goal} curries completed
            </p>
          </div>
          <div className="flex size-12 items-center justify-center rounded-full curry-gradient">
            <Plane className="size-6 text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Journey Progress Bar */}
        <div className="space-y-3">
          {/* Landmarks */}
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-base" aria-hidden="true">🏛️</span>
              <span>London</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span>Mumbai</span>
              <span className="text-base" aria-hidden="true">🕌</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <Progress
              value={percentage}
              className="h-3 bg-muted/50"
            />
            {/* Custom gradient for the progress indicator */}
            <style jsx>{`
              [data-slot="progress-indicator"] {
                background: linear-gradient(135deg, hsl(var(--curry)) 0%, hsl(var(--saffron)) 100%);
              }
            `}</style>
          </div>

          {/* Progress Percentage */}
          <div className="flex justify-center">
            <span className="text-sm font-semibold text-curry">
              {percentage.toFixed(0)}% to Mumbai
            </span>
          </div>
        </div>

        {/* Milestone Achievement (optional - show when reaching milestones) */}
        {curriesCompleted === 10 && (
          <div className="mt-2 rounded-lg bg-saffron/10 border border-saffron/20 p-3 text-center">
            <p className="text-sm font-semibold text-saffron">
              🎉 Milestone: 10 Curries! Keep going!
            </p>
          </div>
        )}
        {curriesCompleted === 25 && (
          <div className="mt-2 rounded-lg bg-saffron/10 border border-saffron/20 p-3 text-center">
            <p className="text-sm font-semibold text-saffron">
              🎉 Halfway there! 25 curries down!
            </p>
          </div>
        )}
        {curriesCompleted === 40 && (
          <div className="mt-2 rounded-lg bg-saffron/10 border border-saffron/20 p-3 text-center">
            <p className="text-sm font-semibold text-saffron">
              🎉 Almost there! Just 10 more curries!
            </p>
          </div>
        )}
        {curriesCompleted === 50 && (
          <div className="mt-2 rounded-lg bg-curry/10 border border-curry/20 p-3 text-center">
            <p className="text-sm font-bold text-curry">
              🎊 GOAL REACHED! Time to book Mumbai! 🎊
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
