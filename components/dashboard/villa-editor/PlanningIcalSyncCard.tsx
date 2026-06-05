"use client"

import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

type Tone = "neutral" | "ok" | "warn"

export function PlanningIcalSyncCard({
  lastLine,
  body,
  tone,
  saving,
  onSync,
}: {
  lastLine: string | null
  body: string
  tone: Tone
  saving: boolean
  onSync: () => void
}) {
  return (
    <div className="rounded-[32px] border border-navy/5 bg-gold/10 p-6 shadow-sm border-gold/20">
      <h4 className="text-[10px] uppercase tracking-widest font-bold text-gold mb-2">Synchronisation iCal</h4>
      {lastLine ? <p className="text-xs font-semibold text-navy/85 leading-relaxed mb-1">{lastLine}</p> : null}
      <p
        className={`text-xs leading-relaxed mb-4 ${
          tone === "warn" ? "text-amber-800" : "text-navy/70"
        }`}
      >
        {body}
      </p>
      <Button
        variant="outline"
        onClick={onSync}
        disabled={saving}
        className="w-full rounded-full border-gold/20 bg-white/50 text-gold text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
      >
        {saving ? <RefreshCw size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        Synchroniser maintenant
      </Button>
    </div>
  )
}
