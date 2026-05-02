"use client";

import { TenantAvatarCircle } from "@/components/espace-client/tenant-ui";

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
  return <TenantAvatarCircle name={name} url={url} size={size} className={className} />;
}
