import * as React from "react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2">
      <input
        id={id}
        type="checkbox"
        ref={ref}
        className={cn("h-4 w-4 accent-gold cursor-pointer", className)}
        {...props}
      />
      {label && <span className="text-[13px] text-navy/80">{label}</span>}
    </label>
  )
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
