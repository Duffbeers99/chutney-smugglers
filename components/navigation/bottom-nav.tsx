"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, User, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuickAddButton } from "@/components/dashboard/quick-add-button"

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const leftNavItems: NavItem[] = [
  {
    href: "/dashboard",
    icon: Home,
    label: "Home",
  },
  {
    href: "/leaderboards",
    icon: Trophy,
    label: "Leaderboards",
  },
]

const rightNavItems: NavItem[] = [
  {
    href: "/restaurants",
    icon: UtensilsCrossed,
    label: "Restaurants",
  },
  {
    href: "/profile",
    icon: User,
    label: "Profile",
  },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      aria-label="Bottom navigation"
    >
      <div className="relative w-full">
        {/* Navigation bar with Bevel-style design */}
        <div className="relative bg-card/95 backdrop-blur-lg border-t border-border shadow-lg rounded-t-3xl mx-auto max-w-lg">
          {/* 2-1-2 Flex Layout for perfect symmetry */}
          <div className="flex items-center justify-between h-16 px-6">
            {/* Left section - 2 icons */}
            <div className="flex items-center gap-2 flex-1 justify-start">
              {leftNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center p-3 transition-all duration-200",
                      "touch-target rounded-xl",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      "active:scale-95",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                  >
                    <Icon
                      className={cn(
                        "size-6 transition-colors",
                        isActive && "drop-shadow-sm"
                      )}
                      aria-hidden="true"
                    />
                  </Link>
                )
              })}
            </div>

            {/* Center spacer for floating button */}
            <div className="w-16 flex-shrink-0" aria-hidden="true" />

            {/* Right section - 2 icons */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              {rightNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-center p-3 transition-all duration-200",
                      "touch-target rounded-xl",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      "active:scale-95",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={item.label}
                  >
                    <Icon
                      className={cn(
                        "size-6 transition-colors",
                        isActive && "drop-shadow-sm"
                      )}
                      aria-hidden="true"
                    />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Floating center + button - positioned absolutely above the nav */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-10 max-w-lg w-full flex justify-center">
          <QuickAddButton variant="floating" />
        </div>
      </div>
    </nav>
  )
}
