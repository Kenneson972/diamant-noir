"use client";

import Image from "next/image";

function initialsFromName(name?: string) {
  if (!name?.trim()) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type TenantAvatarSize = "sm" | "md" | "lg";

const sizeClass: Record<TenantAvatarSize, string> = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-10 w-10 text-[11px]",
  lg: "h-12 w-12 text-[12px]",
};

export function TenantAvatar({
  name,
  url,
  size = "md",
  className,
}: {
  name?: string;
  url?: string;
  size?: TenantAvatarSize;
  className?: string;
}) {
  const initials = initialsFromName(name);

  return (
    <div
      className={[
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy/5 text-navy/60",
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={name ? `Avatar de ${name}` : "Avatar"}
    >
      {url ? (
        <Image src={url} alt="" fill sizes="48px" className="object-cover" />
      ) : (
        <span className="font-bold">{initials}</span>
      )}
    </div>
  );
}
