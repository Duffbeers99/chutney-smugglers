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

const navItems: NavItem[] = [
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
  // Center space for floating + button
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
      <div className="relative mx-auto max-w-lg">
        {/* Navigation bar with Bevel-style design */}
        <div className="relative bg-card/95 backdrop-blur-lg border-t border-border shadow-lg rounded-t-3xl">
          {/* 2-1-2 Grid Layout */}
          <div className="grid grid-cols-4 items-center px-4 h-16">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              // Insert spacer in the middle (after second item, before third)
              if (index === 2) {
                return (
                  <React.Fragment key={`${item.href}-fragment`}>
                    {/* Center spacer for floating button */}
                    <div className="col-span-1" aria-hidden="true" />

                    {/* Third item */}
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200",
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
                  </React.Fragment>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200",
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

        {/* Floating center + button - positioned absolutely above the nav */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-8">
          <QuickAddButton variant="floating" />
        </div>
      </div>
    </nav>
  )
}
