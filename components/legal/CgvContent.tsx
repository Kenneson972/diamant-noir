import { CGV_FULL } from "@/lib/legal";

/** Contenu prose des CGV — utilisé par la page /cgv (variante simple) et le modal checkout. */
export function CgvContent() {
  return (
    <div className="prose prose-sm max-w-none text-navy/80 leading-relaxed whitespace-pre-line">
      {CGV_FULL}
    </div>
  );
}
