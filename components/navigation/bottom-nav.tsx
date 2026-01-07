"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, User, UtensilsCrossed } from "lucide-react"
import { cn } from "@/lib/utils"

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
    href: "/restaurants",
    icon: UtensilsCrossed,
    label: "Restaurants",
  },
  {
    href: "/leaderboards",
    icon: Trophy,
    label: "Leaderboards",
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
      className="fixed bottom-3 left-0 right-0 z-50 safe-area-bottom"
      aria-label="Bottom navigation"
    >
      <div className="relative mx-4">
        {/* Navigation bar with Bevel-style design */}
        <div className="relative bg-card/95 backdrop-blur-lg border border-border shadow-lg rounded-3xl mx-auto max-w-lg">
          {/* Evenly spaced 4-item layout */}
          <div className="flex items-center justify-evenly h-16 px-4">
            {navItems.map((item) => {
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
                      "size-7 transition-colors",
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
    </nav>
  )
}
