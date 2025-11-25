"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: number
  maxValue: number
  suffix?: string
  gradient: "curry" | "saffron" | "terracotta"
  onClick?: () => void
}

function CircularProgress({
  value,
  maxValue,
  size = 120,
  strokeWidth = 8,
  gradient,
}: {
  value: number
  maxValue: number
  size?: number
  strokeWidth?: number
  gradient: "curry" | "saffron" | "terracotta"
}) {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const gradientColors = {
    curry: {
      from: "oklch(0.65 0.20 38)",
      to: "oklch(0.58 0.18 35)",
    },
    saffron: {
      from: "oklch(0.82 0.16 95)",
      to: "oklch(0.72 0.14 75)",
    },
    terracotta: {
      from: "oklch(0.58 0.14 42)",
      to: "oklch(0.48 0.10 40)",
    },
  }

  const colors = gradientColors[gradient]
  const gradientId = `gradient-${gradient}`

  return (
    <svg
      width={size}
      height={size}
      className="transform -rotate-90"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: colors.from }} />
          <stop offset="100%" style={{ stopColor: colors.to }} />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/20"
      />

      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
        style={{
          strokeDashoffset: offset,
        }}
      />
    </svg>
  )
}

function StatCard({
  title,
  value,
  maxValue,
  suffix = "",
  gradient,
  onClick,
}: StatCardProps) {
  const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0

  return (
    <Card
      className={cn(
        "card-parchment card-hover touch-target-lg transition-all duration-300",
        onClick && "cursor-pointer active:scale-95"
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 p-4">
        {/* Circular Progress */}
        <div className="relative">
          <CircularProgress
            value={value}
            maxValue={maxValue}
            gradient={gradient}
          />

          {/* Value in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {value}
                {suffix}
              </div>
              {maxValue > 0 && (
                <div className="text-xs text-muted-foreground">
                  of {maxValue}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {maxValue > 0 && (
            <p className="text-xs text-muted-foreground">{percentage}%</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface StatsCardsProps {
  ratingsThisMonth: number
  totalRatings: number
  averageRating: number
  participationPercentage: number
  onCardClick?: (cardType: "ratings" | "average" | "participation") => void
}

export function StatsCards({
  ratingsThisMonth,
  totalRatings,
  averageRating,
  participationPercentage,
  onCardClick,
}: StatsCardsProps) {
  // Calculate max values for visual display
  const monthlyGoal = 10 // Target ratings per month
  const maxRating = 5 // Max rating is 5 stars
  const maxParticipation = 100 // Max participation is 100%

  return (
    <div className="grid grid-cols-3 gap-3 px-4">
      <StatCard
        title="Your Ratings"
        value={ratingsThisMonth}
        maxValue={monthlyGoal}
        gradient="curry"
        onClick={() => onCardClick?.("ratings")}
      />

      <StatCard
        title="Avg Rating"
        value={Number(averageRating.toFixed(1))}
        maxValue={maxRating}
        suffix="★"
        gradient="saffron"
        onClick={() => onCardClick?.("average")}
      />

      <StatCard
        title="Participation"
        value={participationPercentage}
        maxValue={maxParticipation}
        suffix="%"
        gradient="terracotta"
        onClick={() => onCardClick?.("participation")}
      />
    </div>
  )
}
