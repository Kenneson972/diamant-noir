"use client"

type Tone = "neutral" | "ok" | "warn"

export function IcalConnectivityStatus({
  lastLine,
  body,
  tone,
}: {
  lastLine: string | null
  body: string
  tone: Tone
}) {
  return (
    <div className="mt-4 rounded-xl border border-navy/10 bg-offwhite/80 px-4 py-3 text-xs leading-relaxed">
      {lastLine ? <p className="font-semibold text-navy/90 mb-1">{lastLine}</p> : null}
      <p className={tone === "warn" ? "text-amber-900/90" : "text-navy/65"}>{body}</p>
    </div>
  )
}
