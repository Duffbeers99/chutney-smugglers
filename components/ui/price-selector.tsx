"use client"

import { cn } from "@/lib/utils"

interface PriceSelectorProps {
  value: number
  onChange: (value: number) => void
  className?: string
}

export function PriceSelector({ value, onChange, className }: PriceSelectorProps) {
  const priceLabels = ["£", "££", "£££", "££££", "£££££"]

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((price) => (
          <button
            key={price}
            type="button"
            onClick={() => onChange(price)}
            className={cn(
              "flex-1 p-3 rounded-lg border-2 transition-all font-bold",
              value === price
                ? "border-curry bg-curry/10 text-curry"
                : "border-border hover:border-curry/50 text-muted-foreground"
            )}
          >
            {priceLabels[price - 1]}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Select price range (£ = cheap, £££££ = expensive)
      </p>
    </div>
  )
}
