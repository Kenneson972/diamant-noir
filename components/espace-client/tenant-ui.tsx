"use client";

import Link from "next/link";
import Image from "next/image";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Barres de chargement type skeleton. */
export function Skeleton({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse bg-navy/10", className)} aria-hidden {...rest} />;
}

export function Card({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...rest} />;
}

export function CardHeader({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...rest} />;
}

export function CardTitle({ className, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={className} {...rest} />;
}

export function CardContent({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...rest} />;
}

const buttonVariants = {
  variant: {
    primary:
      "bg-navy text-white border border-transparent hover:bg-gold hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2",
    outline:
      "border border-navy/20 bg-transparent text-navy hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2",
    ghost: "border-0 bg-transparent text-navy hover:bg-navy/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2",
  },
  size: {
    sm: "min-h-[36px] px-3 py-1.5 text-[10px]",
    md: "min-h-[44px] px-6 py-3 text-[10px]",
  },
};

/** Classes pour un `<Link>` avec l’apparence d’un bouton (HTML valide, sans `<button>` imbriqué). */
export function linkAsButtonClasses(
  variant: keyof typeof buttonVariants.variant = "outline",
  size: keyof typeof buttonVariants.size = "sm",
  className?: string
) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.2em] transition-colors",
    buttonVariants.variant[variant],
    buttonVariants.size[size],
    className
  );
}

type ButtonVariants = keyof typeof buttonVariants.variant;
type ButtonSizes = keyof typeof buttonVariants.size;

export type TenantButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariants;
  size?: ButtonSizes;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, TenantButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, type = "button", ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.2em] transition-colors disabled:pointer-events-none disabled:opacity-50",
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    />
  )
);
Button.displayName = "TenantButton";

export function Spinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const s = size === "lg" ? 32 : size === "sm" ? 18 : 24;
  return (
    <span role="status" className="inline-flex" aria-label="Chargement">
      <Loader2 className={cn("animate-spin text-gold", className)} size={s} aria-hidden />
    </span>
  );
}

const chipTone: Record<
  "success" | "warning" | "danger" | "default" | "accent" | "secondary",
  string
> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-red-200 bg-red-50 text-red-900",
  default: "border-navy/10 bg-navy/[0.04] text-navy",
  accent: "border-gold/35 bg-gold/10 text-navy",
  secondary: "border-navy/15 bg-navy/5 text-navy",
};

export function Chip({
  className,
  color = "default",
  children,
}: {
  className?: string;
  color?: keyof typeof chipTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-none border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]",
        chipTone[color] ?? chipTone.default,
        className
      )}
    >
      {children}
    </span>
  );
}

export function Separator({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-navy/8", className)} />;
}

const alertTone: Record<"danger" | "warning" | "success", string> = {
  danger: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
};

export function Alert({
  status,
  className,
  children,
}: {
  status: keyof typeof alertTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="alert" className={cn("flex gap-3 border px-4 py-3 text-sm", alertTone[status], className)}>
      <div className="mt-0.5 flex h-2 w-2 shrink-0 rounded-full bg-current opacity-70" aria-hidden />
      <div className="min-w-0 flex-1 space-y-1">{children}</div>
    </div>
  );
}

export function AlertTitle({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("font-display text-sm font-medium", className)} {...rest} />;
}

export function AlertDescription({ className, ...rest }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-xs opacity-90", className)} {...rest} />;
}

export function BreadcrumbsRow({
  className,
  items,
}: {
  className?: string;
  items: { href?: string; label: string }[];
}) {
  return (
    <nav aria-label="Fil d'Ariane" className={className}>
      <ol className="m-0 flex list-none flex-wrap items-center gap-x-2 gap-y-1 p-0">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-2">
            {i > 0 ? (
              <span className="text-navy/20" aria-hidden>
                /
              </span>
            ) : null}
            {item.href ? (
              <Link href={item.href} className="text-[10px] uppercase tracking-[0.2em] text-navy/40 hover:text-navy">
                {item.label}
              </Link>
            ) : (
              <span className="text-[10px] uppercase tracking-[0.2em] text-navy/55">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Champ formulaire sans lib RAC. */
export function Field({
  id,
  label,
  hint,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="w-full space-y-1.5">
      {id ? (
        <label htmlFor={id} className="block text-[10px] font-bold uppercase tracking-widest text-navy/40">
          {label}
        </label>
      ) : (
        <span className="block text-[10px] font-bold uppercase tracking-widest text-navy/40">{label}</span>
      )}
      {children}
      {hint ? (
        <p id={id ? `${id}-hint` : undefined} className="text-[10px] text-navy/30">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      className={cn(
        "tap-target min-h-[44px] w-full rounded-xl border border-navy/20 px-3 py-2 text-sm text-navy placeholder:text-navy/30 focus:border-navy focus:outline-none focus:ring-0 disabled:bg-navy/[0.04] disabled:text-navy/50",
        className
      )}
      {...rest}
    />
  );
}

/** Panneau repliable `<details>` (remplace accordion HeroUI). */
export function AccordionDetails({
  trigger,
  children,
}: {
  trigger: ReactNode;
  children: ReactNode;
}) {
  return (
    <details className="group border-b border-navy/5 last:border-b-0 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-5 py-4 text-left font-display text-sm text-navy hover:bg-navy/[0.02]">
        {trigger}
        <ChevronDown
          size={18}
          className="ml-auto shrink-0 text-navy/30 transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <div className="space-y-1 border-t border-navy/5 px-5 pb-5 pt-4 text-sm leading-relaxed text-navy/70">
        {children}
      </div>
    </details>
  );
}

export function AccordionShell({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("border border-navy/8 bg-white", className)}>{children}</div>;
}

/** Avatar tenant. */
export function TenantAvatarCircle({
  name,
  url,
  size = "md",
  className,
}: {
  name?: string;
  url?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const box =
    size === "lg"
      ? "h-11 w-11 min-h-[44px] min-w-[44px] text-sm"
      : size === "sm"
        ? "h-8 w-8 text-[10px]"
        : "h-10 w-10 text-xs";

  function initials(nm?: string) {
    if (!nm?.trim()) return "?";
    return nm
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy/[0.06] font-bold text-navy/60",
        box,
        className
      )}
      title={name ?? undefined}
    >
      {url ? (
        <Image src={url} alt="" fill className="object-cover" sizes="64px" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </div>
  );
}
