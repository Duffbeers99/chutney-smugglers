import { cn } from "@/lib/utils"

interface PriceDisplayProps {
  level: number | undefined
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PriceDisplay({ level, size = "sm", className }: PriceDisplayProps) {
  if (!level || level < 1 || level > 5) {
    return null
  }

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 text-curry font-bold",
        sizeClasses[size],
        className
      )}
    >
      {Array.from({ length: level }).map((_, i) => (
        <span key={i}>£</span>
      ))}
    </div>
  )
}
