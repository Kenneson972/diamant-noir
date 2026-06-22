"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp, RotateCcw } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { useCopilot } from "@/hooks/useCopilot";
import { CopilotMessage } from "@/components/dashboard/proprio/CopilotMessage";
import { CopilotActionCard } from "@/components/dashboard/CopilotActionCard";

export function AdminCopilotChat() {
  const { messages, isLoading, sendMessage, clearMessages, confirmAction } =
    useCopilot({ webhookUrl: "/api/concierge/admin" });
  const [input, setInput] = useState("");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100dvh-13rem)] flex-col rounded-lg border border-navy/10 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-navy/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <KayvilaPngIcon name="sparkle" size={20} alt="" />
          <span className="font-display text-sm font-semibold text-navy">Concierge IA — Admin</span>
        </div>
        <button type="button" onClick={clearMessages} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-navy/40 transition-colors hover:text-navy/70" aria-label="Réinitialiser la conversation">
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length <= 1 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <KayvilaPngIcon name="sparkle" size={32} alt="" className="mb-3 opacity-40" />
            <p className="text-[13px] leading-relaxed text-navy/60">Concierge IA Kayvila — supervision globale. Posez une question ou demandez une action (prix, blocage, soumission).</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.content ? <CopilotMessage message={msg} /> : null}
                {msg.actionResult && msg.action ? (
                  <CopilotActionCard action={msg.action} result={msg.actionResult} />
                ) : null}
                {msg.proposedAction && !dismissed.has(msg.id) ? (
                  <div className="mt-3 rounded-lg border border-gold/30 bg-gold/[0.04] p-4">
                    <div className="flex items-start gap-3">
                      <KayvilaPngIcon name="shield-check" size={20} alt="" className="mt-0.5" />
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-navy">Confirmer cette action ?</p>
                        <p className="mt-1 text-[12px] text-navy/65">{describeAction(msg.proposedAction)}</p>
                        <div className="mt-3 flex gap-2">
                          <button onClick={() => { confirmAction(msg.proposedAction!.action, msg.proposedAction!.action_data); setDismissed((p) => new Set(p).add(msg.id)); }} className="rounded-md bg-navy px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white hover:bg-navy/90">Confirmer</button>
                          <button onClick={() => setDismissed((p) => new Set(p).add(msg.id))} className="rounded-md border border-navy/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-navy/55 hover:text-navy">Annuler</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900"><KayvilaPngIcon name="sparkle" size={16} alt="" invert /></div>
                <div className="rounded-bl-sm rounded-xl bg-cream p-3"><div className="flex gap-1.5"><span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" /><span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" style={{ animationDelay: "0.15s" }} /><span className="dn-typing-dot h-2 w-2 rounded-full bg-navy-900/40" style={{ animationDelay: "0.3s" }} /></div></div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="border-t border-navy/5 px-4 py-3">
        <form onSubmit={submit} className="flex items-center gap-2">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Posez votre question..." disabled={isLoading} className="flex-1 rounded-lg border border-navy/15 bg-cream px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy/30 outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 disabled:opacity-50" />
          <button type="submit" disabled={!input.trim() || isLoading} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-900 text-white transition-colors hover:bg-navy-800 disabled:opacity-40" aria-label="Envoyer"><ArrowUp className="h-4 w-4" /></button>
        </form>
      </div>
    </div>
  );
}

function describeAction(pa: { action: string; action_data: Record<string, unknown> }): string {
  const d = pa.action_data as Record<string, any>;
  if (pa.action === "SET_PRICE") return `Modifier le prix → ${d.price?.price_per_night} €/nuit`;
  if (pa.action === "BLOCK_DATE") return `Bloquer du ${d.block?.start_date} au ${d.block?.end_date}`;
  if (pa.action === "UPDATE_SUBMISSION_STATUS") return `Soumission → ${d.submission?.status}`;
  return "Action à confirmer";
}
