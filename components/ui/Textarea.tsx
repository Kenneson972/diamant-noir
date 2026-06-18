import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-none border border-navy/15 bg-white px-4 py-3 text-base text-navy",
        "placeholder:text-navy/40 resize-y",
        "focus-visible:outline-none focus-visible:border-gold focus-visible:ring-1 focus-visible:ring-gold/30",
        "transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Textarea.displayName = "Textarea"

export { Textarea }
