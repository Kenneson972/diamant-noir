"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Send } from "lucide-react";

const REQUEST_TYPES: Record<string, string> = {
  early_checkin: "Early check-in",
  late_checkout: "Late check-out",
  date_change: "Modification de dates",
  issue: "Signaler un problème",
  service: "Service ponctuel",
  other: "Autre",
};

interface RequestFormProps {
  bookingId: string;
  onSuccess: () => void;
}

export function RequestForm({ bookingId, onSuccess }: RequestFormProps) {
  const supabase = getSupabaseBrowser();
  const [type, setType] = useState("early_checkin");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !message.trim()) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    const { error } = await supabase.from("requests").insert({
      booking_id: bookingId,
      guest_id: user.id,
      type,
      message: message.trim(),
      status: "pending",
    });
    if (!error) {
      await supabase.from("notifications").insert({
        user_id: user.id,
        type: "system",
        title: "Demande envoyée",
        body: `Votre demande "${REQUEST_TYPES[type]}" a été transmise à l'équipe Kayvila.`,
        action_url: "/espace-client/demandes",
      });
      setDone(true);
      onSuccess();
    }
    setSending(false);
  };

  if (done) {
    return (
      <div className="border border-gold/30 bg-gold/[0.04] p-6 text-center">
        <p className="font-display text-lg text-navy">Demande envoyée</p>
        <p className="text-sm text-navy/50 mt-1">L&apos;équipe Kayvila vous répondra rapidement.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="request-type" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1">
          Type de demande
        </label>
        <select
          id="request-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/50"
        >
          {Object.entries(REQUEST_TYPES).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="request-message" className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-1">
          Message
        </label>
        <textarea
          id="request-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          placeholder="Décrivez votre demande..."
          className="w-full border border-navy/15 bg-white px-4 py-3 text-sm text-navy placeholder:text-navy/30 focus:outline-none focus:border-gold/50 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={sending || !message.trim()}
        className="inline-flex items-center gap-2 bg-navy px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={14} />
        {sending ? "Envoi..." : "Envoyer la demande"}
      </button>
    </form>
  );
}
