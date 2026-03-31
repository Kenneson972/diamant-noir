"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, Calendar, MapPin, ArrowRight } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const bookingId = searchParams.get("bookingId");
  const [data, setData] = useState<{ booking: any; villa: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      fetch(`/api/booking-session?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Not found"))))
        .then(setData)
        .catch(() => setError("Réservation introuvable."))
        .finally(() => setLoading(false));
    } else if (bookingId) {
      setData({ booking: { id: bookingId }, villa: null });
      setLoading(false);
    } else {
      setError("Paramètres de confirmation manquants.");
      setLoading(false);
    }
  }, [sessionId, bookingId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-offwhite pt-32 pb-20 flex items-center justify-center">
        <p className="text-navy/60">Chargement de votre confirmation...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-offwhite pt-32 pb-20 px-6">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-navy/80 mb-6">{error || "Une erreur est survenue."}</p>
          <Link href="/book" className="text-gold font-medium hover:underline">
            Retour à la réservation
          </Link>
        </div>
      </main>
    );
  }

  const { booking, villa } = data;
  const isConfirmed = booking?.status === "confirmed" || booking?.payment_status === "paid";

  return (
    <main className="min-h-screen bg-offwhite pt-32 pb-20 px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gold/20 text-gold mb-8">
          <Check className="w-8 h-8" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl text-navy text-center mb-2">
          Réservation confirmée
        </h1>
        <p className="text-navy/60 text-center mb-10">
          {isConfirmed
            ? "Un email de confirmation vous a été envoyé."
            : "Votre paiement a bien été enregistré. Vous recevrez bientôt un email de confirmation."}
        </p>

        {(villa || booking) && (
          <div className="bg-white border border-navy/10 rounded-xl p-6 space-y-4">
            {villa?.name && (
              <div className="flex items-center gap-3">
                <MapPin className="text-gold shrink-0" size={20} />
                <span className="text-navy font-medium">{villa.name}</span>
                {villa.location && <span className="text-navy/60"> — {villa.location}</span>}
              </div>
            )}
            {booking?.start_date && booking?.end_date && (
              <div className="flex items-center gap-3">
                <Calendar className="text-gold shrink-0" size={20} />
                <span className="text-navy">
                  Du {new Date(booking.start_date).toLocaleDateString("fr-FR")} au{" "}
                  {new Date(booking.end_date).toLocaleDateString("fr-FR")}
                </span>
              </div>
            )}
            {booking?.price != null && (
              <p className="text-navy/80 pt-2 border-t border-navy/10">
                Montant : <strong>{Number(booking.price).toLocaleString("fr-FR")} €</strong>
              </p>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/villas"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-navy text-white px-6 py-3 hover:bg-gold hover:text-navy transition-colors"
          >
            Découvrir nos villas
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-navy/30 text-navy px-6 py-3 hover:bg-navy/5 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-offwhite pt-32 pb-20 flex items-center justify-center">
        <p className="text-navy/60">Chargement...</p>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
