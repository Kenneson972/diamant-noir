"use client";

import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { PressableFeedback } from "@heroui-pro/react";
import { cn } from "@/lib/utils";

type KayvilaPressableButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "gold" | "navy";
};

const VARIANT_CLASSES: Record<NonNullable<KayvilaPressableButtonProps["variant"]>, string> = {
  gold:
    "flex items-center justify-center gap-2 rounded-xl bg-gold text-sm font-bold uppercase tracking-widest !text-navy transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:grayscale",
  navy:
    "flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] bg-navy !text-white transition-all duration-300 hover:bg-gold hover:!text-navy disabled:bg-navy/10 disabled:!text-navy/50 disabled:cursor-not-allowed",
};

export function KayvilaPressableButton({
  children,
  className,
  variant = "gold",
  disabled = false,
  type = "button",
  ...props
}: KayvilaPressableButtonProps) {
  const isDisabled = Boolean(disabled);

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn("relative isolate w-full overflow-hidden py-4", VARIANT_CLASSES[variant], className)}
      {...props}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2">{children}</span>
      <PressableFeedback.Ripple
        isDisabled={isDisabled}
        pressedOpacity={0.2}
        className="z-0"
        style={{ "--pressable-feedback-ripple-color": "#0A0A0A" } as CSSProperties}
      />
    </button>
  );
}
