import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-gradient-to-r from-navy/5 via-navy/10 to-navy/5 bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  );
}
