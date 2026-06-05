"use client";

import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Star, Send } from "lucide-react";

interface ReviewFormProps {
  bookingId: string;
  villaId: string;
  onSuccess: () => void;
}

export function ReviewForm({ bookingId, villaId, onSuccess }: ReviewFormProps) {
  const supabase = getSupabaseBrowser();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || rating === 0) return;
    setSending(true);
    setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }
    const { error: insertError } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      guest_id: user.id,
      villa_id: villaId,
      rating,
      comment: comment.trim() || null,
      photos: [],
      status: "pending",
    });
    if (insertError) {
      setError(insertError.code === "23505" ? "Vous avez déjà donné votre avis pour ce séjour." : "Une erreur est survenue.");
      setSending(false);
      return;
    }
    setDone(true);
    setSending(false);
    onSuccess();
  };

  if (done) {
    return (
      <div className="border border-gold/30 bg-gold/[0.04] p-4 text-center">
        <p className="font-display text-base text-navy">Merci pour votre avis !</p>
        <p className="text-[11px] text-navy/50 mt-1">Il sera publié après validation par notre équipe.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="border border-navy/10 bg-white p-4 space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50">Donner mon avis</p>

      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="text-gold hover:scale-110 transition-transform"
            aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
          >
            <Star
              size={22}
              fill={(hover || rating) >= star ? "currentColor" : "none"}
              strokeWidth={1}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-[11px] text-navy/55 ml-1">{rating}/5</span>
        )}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Partagez votre expérience (optionnel)..."
        className="w-full border border-navy/15 bg-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-gold/50"
      />

      {error && <p className="text-[11px] text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={sending || rating === 0}
        className="inline-flex items-center gap-1.5 bg-navy px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white hover:bg-navy/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Send size={12} />
        {sending ? "Envoi..." : "Envoyer mon avis"}
      </button>
    </form>
  );
}
