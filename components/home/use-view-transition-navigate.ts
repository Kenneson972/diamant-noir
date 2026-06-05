"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/** Navigation avec fondue si le navigateur supporte View Transitions API. */
export function useViewTransitionNavigate() {
  const router = useRouter();
  return useCallback(
    (href: string) => {
      const go = () => {
        router.push(href);
      };
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (
        !reduceMotion &&
        typeof document !== "undefined" &&
        "startViewTransition" in document
      ) {
        (document as Document & { startViewTransition: (cb: () => void) => unknown }).startViewTransition(
          go
        );
      } else {
        go();
      }
    },
    [router]
  );
}
