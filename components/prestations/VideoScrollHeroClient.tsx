"use client"

import dynamic from "next/dynamic"

// GSAP + canvas ne peuvent pas tourner en SSR → ssr: false (uniquement dans un Client Component)
const VideoScrollHero = dynamic(
  () =>
    import("@/components/prestations/VideoScrollHero").then((m) => ({
      default: m.VideoScrollHero,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#0A0A0A]">
        <p className="mb-6 font-display text-[9px] tracking-[0.55em] text-gold/40 uppercase">
          Martinique
        </p>
        <p className="font-display text-2xl tracking-widest text-white">Diamant Noir</p>
        <div className="mt-8 h-px w-52 bg-white/10">
          <div className="h-full w-0 animate-pulse bg-gold" />
        </div>
      </div>
    ),
  }
)

export function VideoScrollHeroClient() {
  return <VideoScrollHero />
}
