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
}

export function QuickAddButton({
  href = "/add-rating",
  onClick,
  className,
}: QuickAddButtonProps) {
  const buttonContent = (
    <Button
      size="lg"
      className={cn(
        "touch-target-lg btn-curry fixed bottom-24 right-6 z-40",
        "size-14 rounded-full shadow-lg hover:shadow-xl",
        "transition-all duration-300 hover:scale-110 active:scale-95",
        "animate-pulse-curry",
        className
      )}
      onClick={onClick}
      aria-label="Add new curry rating"
    >
      <Plus className="size-6" aria-hidden="true" />
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
