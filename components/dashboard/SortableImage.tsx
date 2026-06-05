"use client";

import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";

type SortableImageProps = {
  url: string;
  isPrimary: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetPrimary: (url: string) => void;
  onRemove: (url: string) => void;
};

export function SortableImage({
  url,
  isPrimary,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onSetPrimary,
  onRemove,
}: SortableImageProps) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-2xl border border-navy/5 bg-white shadow-sm">
      <Image src={url} alt="Galerie" fill className="object-cover" />

      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          aria-label="Monter la photo"
          disabled={!canMoveUp}
          onClick={onMoveUp}
          className="tap-target rounded-lg bg-navy/40 p-1 text-white disabled:opacity-30"
        >
          <ChevronUp size={14} />
        </button>
        <button
          type="button"
          aria-label="Descendre la photo"
          disabled={!canMoveDown}
          onClick={onMoveDown}
          className="tap-target rounded-lg bg-navy/40 p-1 text-white disabled:opacity-30"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-navy/80 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onSetPrimary(url)}
          className={`rounded-full px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest transition-all ${
            isPrimary ? "bg-gold text-navy" : "bg-white text-navy hover:bg-gold"
          }`}
        >
          {isPrimary ? "Principale" : "Définir"}
        </button>
        <button
          type="button"
          onClick={() => onRemove(url)}
          className="rounded-full bg-red-500 px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-white hover:bg-red-600"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
