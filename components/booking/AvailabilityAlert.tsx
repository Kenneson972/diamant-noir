"use client";

/**
 * AvailabilityAlert — Diamant Noir
 * ─────────────────────────────────
 * Widget "Être alerté de la disponibilité".
 * L'utilisateur entre son email + ses dates souhaitées.
 * L'entrée est sauvegardée dans Supabase (table availability_alerts).
 * Un webhook n8n ou une Edge Function se charge d'envoyer l'email
 * quand les dates se libèrent.
 *
 * Usage : <AvailabilityAlert villaId={id} villaName={name} />
 */

import { useState } from "react";
import { Bell, CheckCircle, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase";

interface AvailabilityAlertProps {
  villaId: string;
  villaName: string;
  /** Pré-remplissage optionnel si l'utilisateur a déjà saisi des dates */
  defaultCheckin?: string;
  defaultCheckout?: string;
}

type Status = "idle" | "loading" | "success" | "error";

export function AvailabilityAlert({
  villaId,
  villaName,
  defaultCheckin = "",
  defaultCheckout = "",
}: AvailabilityAlertProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [checkin, setCheckin] = useState(defaultCheckin);
  const [checkout, setCheckout] = useState(defaultCheckout);
  const [status, setStatus] = useState<Status>("idle");
  const supabase = getSupabaseBrowser();

  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !checkin || !checkout) return;
    setStatus("loading");

    try {
      // Pré-remplir l'email depuis la session si connecté
      let resolvedEmail = email;
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email && !email) resolvedEmail = session.user.email;
      }

      const { error } = await (supabase! as any)
        .from("availability_alerts")
        .insert({
          villa_id: villaId,
          email: resolvedEmail,
          checkin_date: checkin,
          checkout_date: checkout,
          notified: false,
        });

      if (error) throw error;
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 border border-navy/15 text-[10px] font-bold uppercase tracking-[0.22em] text-navy/60 hover:text-navy hover:border-navy/30 transition-all duration-200"
      >
        <Bell size={12} strokeWidth={1.8} />
        Me prévenir si ces dates se libèrent
      </button>
    );
  }

  return (
    <div className="border border-gold/30 bg-gold/[0.03] p-5 space-y-4">
      <div className="flex items-start gap-2">
        <Bell size={14} className="text-gold mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-semibold text-navy">
            Alerte disponibilité
          </p>
          <p className="text-[10px] text-navy/50 mt-0.5 leading-relaxed">
            Nous vous préviendrons dès que <strong>{villaName}</strong> sera disponible sur vos dates.
          </p>
        </div>
      </div>

      {status === "success" ? (
        <div className="flex items-center gap-2 py-3">
          <CheckCircle size={16} className="text-green-600 shrink-0" />
          <p className="text-xs text-green-700 font-medium">
            Alerte enregistrée ! Nous vous contacterons à <strong>{email}</strong>.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Email */}
          <div>
            <label className="block text-[9px] uppercase tracking-[0.18em] text-navy/45 mb-1.5">
              Votre email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full border border-navy/12 px-3 py-2.5 text-sm text-navy placeholder-navy/30 focus:outline-none focus:border-gold/60 bg-white transition-colors"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[9px] uppercase tracking-[0.18em] text-navy/45 mb-1.5">
                Arrivée souhaitée
              </label>
              <input
                type="date"
                required
                min={today}
                value={checkin}
                onChange={(e) => setCheckin(e.target.value)}
                className="w-full border border-navy/12 px-3 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/60 bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-[0.18em] text-navy/45 mb-1.5">
                Départ souhaité
              </label>
              <input
                type="date"
                required
                min={checkin || today}
                value={checkout}
                onChange={(e) => setCheckout(e.target.value)}
                className="w-full border border-navy/12 px-3 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/60 bg-white transition-colors"
              />
            </div>
          </div>

          {status === "error" && (
            <p className="text-xs text-red-600">
              Une erreur est survenue. Réessayez ou contactez-nous directement.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex-1 flex items-center justify-center gap-2 bg-navy py-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white hover:bg-gold hover:text-navy transition-all duration-200 disabled:opacity-50"
            >
              {status === "loading" ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Bell size={11} />
              )}
              M'alerter
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 border border-navy/12 text-[10px] text-navy/50 hover:text-navy transition-colors uppercase tracking-[0.15em]"
            >
              Annuler
            </button>
          </div>

          <p className="text-[9px] text-navy/30 leading-relaxed">
            Vos données sont utilisées uniquement pour cette alerte.
            Aucun démarchage commercial.
          </p>
        </form>
      )}
    </div>
  );
}
