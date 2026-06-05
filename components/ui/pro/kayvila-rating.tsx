"use client";

import { Rating } from "@heroui-pro/react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const GOLD_STAR = (
  <Star className="size-full fill-gold text-gold" aria-hidden />
);

type KayvilaRatingProps = {
  value: number;
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  onChange?: (value: number) => void;
  className?: string;
};

export function KayvilaRating({
  value,
  readOnly = true,
  size = "md",
  onChange,
  className,
}: KayvilaRatingProps) {
  const sizeClass =
    size === "lg" ? "gap-1 [&_[data-slot=rating-item]]:size-6" : size === "sm" ? "gap-0.5 [&_[data-slot=rating-item]]:size-3.5" : "gap-0.5 [&_[data-slot=rating-item]]:size-4";

  return (
    <Rating
      value={value}
      isReadOnly={readOnly}
      onValueChange={readOnly ? undefined : onChange}
      icon={GOLD_STAR}
      className={cn(sizeClass, className)}
      aria-label={readOnly ? `Note ${value} sur 5` : "Votre note"}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Rating.Item key={star} value={star} />
      ))}
    </Rating>
  );
}
