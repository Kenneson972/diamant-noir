"use client"

import { Check, Circle } from "lucide-react"

export type VillaPublishChecklistItem = {
  id: string
  ok: boolean
  label: string
  optional?: boolean
}

export function VillaPublishChecklist({ items }: { items: VillaPublishChecklistItem[] }) {
  const requiredOk = items.filter((i) => !i.optional).every((i) => i.ok)
  return (
    <div className="rounded-2xl border border-navy/10 bg-offwhite/80 px-5 py-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-navy/45 mb-3">
        Avant publication — repère rapide
      </p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2 text-sm text-navy/80">
            {item.ok ? (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-navy/25" aria-hidden />
            )}
            <span className={item.optional && !item.ok ? "text-navy/55" : ""}>
              {item.label}
              {item.optional ? <span className="ml-1 text-[10px] text-navy/35">(optionnel)</span> : null}
            </span>
          </li>
        ))}
      </ul>
      {requiredOk ? (
        <p className="mt-3 text-[11px] text-emerald-700">Les points essentiels sont couverts. Vous pouvez publier.</p>
      ) : (
        <p className="mt-3 text-[11px] text-navy/45">Rien n&apos;est bloquant — complétez au fil de l&apos;eau.</p>
      )}
    </div>
  )
}
