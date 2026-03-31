"use client";

/**
 * CompareBar — Diamant Noir
 * ──────────────────────────
 * Barre flottante en bas de page, apparaît dès qu'une villa
 * est ajoutée à la comparaison. Max 3 villas.
 * À placer dans le layout global (ou dans /villas/layout.tsx).
 */

import { useCompare } from "@/contexts/CompareContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { X, ArrowRight, Scale } from "lucide-react";

export function CompareBar() {
  const { items, remove, clear, count } = useCompare();
  const router = useRouter();

  if (count === 0) return null;

  function handleCompare() {
    const ids = items.map((i) => i.id).join(",");
    router.push(`/villas/comparer?ids=${ids}`);
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-fade-up safe-bottom">
      {/* Backdrop blur subtle */}
      <div className="border-t border-white/10 bg-navy/95 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] md:backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-4">

          {/* Icône + label */}
          <div className="hidden sm:flex items-center gap-2 text-white/60 shrink-0">
            <Scale size={15} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">
              Comparer ({count}/3)
            </span>
          </div>

          {/* Slots villas */}
          <div className="flex items-center gap-3 flex-1 overflow-x-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2.5 bg-white/[0.07] border border-white/10 px-3 py-2 shrink-0"
              >
                {item.image && (
                  <div className="relative w-9 h-9 shrink-0 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="36px"
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate max-w-[120px]">
                    {item.name}
                  </p>
                  <p className="text-white/45 text-[9px] tracking-wide truncate max-w-[120px]">
                    {item.location}
                  </p>
                </div>
                <button
                  onClick={() => remove(item.id)}
                  aria-label={`Retirer ${item.name} de la comparaison`}
                  className="tap-target ml-1 shrink-0 text-white/30 transition-colors hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Slots vides */}
            {Array.from({ length: 3 - count }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="w-[140px] h-[52px] border border-dashed border-white/15 shrink-0 flex items-center justify-center"
              >
                <span className="text-[9px] text-white/25 uppercase tracking-[0.15em]">
                  + Villa
                </span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clear}
              className="text-[10px] text-white/40 hover:text-white transition-colors uppercase tracking-[0.15em] hidden sm:block"
            >
              Effacer
            </button>
            <button
              onClick={handleCompare}
              disabled={count < 2}
              className={`
                tap-target flex items-center gap-2 px-4 py-2.5 sm:px-5
                text-[10px] font-bold uppercase tracking-[0.2em]
                transition-all duration-200
                ${count >= 2
                  ? "bg-gold text-navy hover:bg-white"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
                }
              `}
            >
              Comparer <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
