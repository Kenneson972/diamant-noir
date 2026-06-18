import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select
      className={cn(
        "flex h-12 w-full appearance-none rounded-none border border-navy/15 bg-white px-4 text-base text-navy",
        "focus-visible:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold/30",
        "transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  )
)
Select.displayName = "Select"

export { Select }
