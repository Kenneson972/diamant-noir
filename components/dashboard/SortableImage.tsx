"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { GripVertical } from "lucide-react";

type SortableImageProps = {
  url: string;
  isPrimary: boolean;
  onSetPrimary: (url: string) => void;
  onRemove: (url: string) => void;
};

export function SortableImage({ url, isPrimary, onSetPrimary, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-2xl border border-navy/5 bg-white shadow-sm"
    >
      <Image src={url} alt="Galerie" fill className="object-cover" />
      
      {/* Handle for dragging */}
      <div 
        {...attributes} 
        {...listeners}
        className="absolute left-2 top-2 z-10 cursor-grab rounded-lg bg-navy/40 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical size={14} />
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
