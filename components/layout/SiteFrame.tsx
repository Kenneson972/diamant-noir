"use client";

import { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import { HomeAudienceProvider } from "@/contexts/HomeAudienceContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { resetBodyScrollLock } from "@/lib/bodyScrollLock";

/**
 * Reset scroll lock avant les effets des enfants (ordre React : parent → enfant au montage).
 * + BFCache : pageshow `persisted` peut restaurer un body.overflow « collé ».
 */
export function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useLayoutEffect(() => {
    resetBodyScrollLock();
  }, [pathname]);

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) resetBodyScrollLock();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <HomeAudienceProvider>
      <Navbar />
      {children}
      <Footer />
    </HomeAudienceProvider>
  );
}
