"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useViewTransitionNavigate } from "@/components/home/use-view-transition-navigate";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: string;
};

/** Lien vers `/proprietaires` avec View Transition douce quand c’est supporté. */
export function ProprietairesTransitionLink({
  href = "/proprietaires",
  onClick,
  children,
  ...rest
}: Props) {
  const navigate = useViewTransitionNavigate();

  return (
    <Link
      {...rest}
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </Link>
  );
}
