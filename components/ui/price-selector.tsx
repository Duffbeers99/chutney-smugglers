"use client"

import { cn } from "@/lib/utils"

interface PriceSelectorProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function PriceSelector({ value, onChange, className }: PriceSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((price) => (
          <button
            key={price}
            type="button"
            onClick={() => onChange(price)}
            className={cn(
              "text-3xl font-bold transition-all hover:scale-110",
              price <= value
                ? "text-amber-500"
                : "text-muted-foreground/30"
            )}
          >
            £
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Select price range (£ = cheap, £££££ = expensive)
      </p>
    </div>
  )
}
