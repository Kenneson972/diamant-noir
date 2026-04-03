"use client";

import { Avatar } from "@heroui/react";

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
    <Avatar size={size} variant="default" className={className}>
      {url ? <Avatar.Image src={url} alt="" /> : null}
      <Avatar.Fallback className="font-bold text-navy/60">{initials}</Avatar.Fallback>
    </Avatar>
  );
}
