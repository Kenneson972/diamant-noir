import * as React from "react"
import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "gold" | "success" | "warning" | "danger"

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-navy/5 text-navy/70",
  gold:    "bg-gold/10 text-[#B8860B]",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger:  "bg-red-50 text-red-600",
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
