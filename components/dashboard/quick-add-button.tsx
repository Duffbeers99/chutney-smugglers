"use client"

import * as React from "react"
import Link from "next/link"
import { Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface QuickAddButtonProps {
  href?: string
  onClick?: () => void
  className?: string
  variant?: "floating" | "fixed"
}

export function QuickAddButton({
  href = "/add-rating",
  onClick,
  className,
  variant = "fixed",
}: QuickAddButtonProps) {
  const buttonContent = (
    <Button
      size="lg"
      className={cn(
        "touch-target-lg shadow-xl",
        "size-16 rounded-full",
        "transition-all duration-300 hover:scale-110 active:scale-95",
        "bg-gradient-to-br from-primary via-primary to-terracotta",
        "hover:shadow-2xl hover:shadow-primary/30",
        "relative overflow-visible",
        // Floating variant (embedded in nav)
        variant === "floating" && [
          "shadow-2xl shadow-primary/40",
        ],
        // Fixed variant (standalone, bottom-right)
        variant === "fixed" && [
          "fixed bottom-24 right-6 z-40",
          "animate-pulse-curry",
        ],
        className
      )}
      onClick={onClick}
      aria-label="Add new curry rating"
    >
      <Plus className="size-7 text-white" strokeWidth={2.5} aria-hidden="true" />

      {/* Subtle glow effect */}
      <div
        className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none"
        aria-hidden="true"
      />
    </Button>
  )

  if (href && !onClick) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href}>{buttonContent}</Link>
          </TooltipTrigger>
          <TooltipContent side="left" className="card-parchment">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-saffron" aria-hidden="true" />
              <span>Add Curry Rating</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent side="left" className="card-parchment">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-saffron" aria-hidden="true" />
            <span>Add Curry Rating</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
