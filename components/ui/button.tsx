import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "gold" | "danger" | "secondary"
  size?: "default" | "sm" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants = {
      default:   "bg-navy text-white hover:bg-navy/90",
      outline:   "border border-navy/15 bg-white hover:bg-navy/5 text-navy",
      ghost:     "hover:bg-navy/5 text-navy",
      gold:      "bg-gold text-white hover:bg-gold/90",
      danger:    "bg-red-600 text-white hover:bg-red-700",
      secondary: "bg-navy/5 text-navy hover:bg-navy/10",
    }
    const sizes = {
      sm:      "h-9 px-3 text-sm",
      default: "h-11 px-4 py-2 text-sm",
      lg:      "h-12 px-8 text-base",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-300",
          "focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
