"use client"

import * as React from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { AddSoloMissionDrawer } from "@/components/curry/add-solo-mission-drawer"

export function FloatingActionButton() {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  return (
    <>
      <Button
        onClick={() => setIsDrawerOpen(true)}
        className={cn(
          "fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-lg z-40",
          "bg-[oklch(0.75_0.15_85)] hover:bg-[oklch(0.70_0.15_85)]",
          "text-white transition-all duration-200",
          "hover:scale-110 active:scale-95"
        )}
        size="icon"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">Log Solo Mission</span>
      </Button>

      <AddSoloMissionDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} />
    </>
  )
}
