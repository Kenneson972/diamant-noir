"use client";

import { HomeAudienceProvider } from "@/contexts/HomeAudienceContext";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function SiteFrame({ children }: { children: React.ReactNode }) {
  return (
    <HomeAudienceProvider>
      <Navbar />
      {children}
      <Footer />
    </HomeAudienceProvider>
  );
}
