"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, PlusCircle, Trophy, User } from "lucide-react"
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
    href: "/add-rating",
    icon: PlusCircle,
    label: "Add",
  },
  {
    href: "/leaderboards",
    icon: Trophy,
    label: "Leaders",
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
      className="fixed bottom-0 left-0 right-0 z-50 border-t card-parchment shadow-lg safe-area-bottom"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "touch-target flex flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 transition-all duration-200",
                  "focus-curry hover:bg-curry/10 active:scale-95",
                  isActive && "text-curry"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "size-6 transition-colors",
                    isActive ? "text-curry" : "text-muted-foreground"
                  )}
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-curry" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
