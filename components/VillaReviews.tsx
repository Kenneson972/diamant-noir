"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";

interface Review {
  id: string;
  guest_name: string;
  full_name?: string | null;
  avatar_url?: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  cleanliness_rating?: number | null;
  location_rating?: number | null;
  communication_rating?: number | null;
  value_rating?: number | null;
  checkin_rating?: number | null;
}

const CATEGORIES: { key: keyof Review; label: string }[] = [
  { key: "cleanliness_rating", label: "Propreté" },
  { key: "location_rating", label: "Emplacement" },
  { key: "communication_rating", label: "Communication" },
  { key: "value_rating", label: "Rapport qualité-prix" },
  { key: "checkin_rating", label: "Arrivée" },
];

function CategoryBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 5) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 shrink-0 text-xs text-navy/60">{label}</span>
      <div className="flex-1 h-1.5 bg-navy/8">
        <div
          className="h-full bg-navy transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 text-right text-xs font-semibold text-navy tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}

function ReviewerAvatar({ review }: { review: Review }) {
  const name = review.full_name || review.guest_name;
  if (review.avatar_url) {
    return (
      <div className="w-8 h-8 shrink-0 overflow-hidden border border-navy/10">
        <Image src={review.avatar_url} alt={name} fill className="w-full h-full object-cover" />
      </div>
    );
  }
  const initial = name.charAt(0);
  return (
    <div className="w-8 h-8 flex items-center justify-center bg-navy/10 text-xs font-bold text-navy uppercase">
      {initial}
    </div>
  );
}

export function VillaReviews({ villaId, villaName }: { villaId: string; villaName: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchReviews = () => {
    setError(false);
    setLoading(true);
    fetch(`/api/reviews?villa_id=${villaId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReviews(data);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReviews();
  }, [villaId]);

  if (error) {
    return (
      <section className="pt-10 border-t border-navy/10">
        <h2 className="font-display font-normal text-2xl text-navy mb-4">Avis voyageurs</h2>
        <div className="border border-navy/10 bg-white p-8 text-center">
          <p className="text-sm text-navy/60 mb-3">Impossible de charger les avis.</p>
          <button onClick={fetchReviews} className="text-xs font-bold uppercase tracking-wider text-gold hover:underline">
            Réessayer
          </button>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="pt-10 border-t border-navy/10">
        <h2 className="font-display font-normal text-2xl text-navy mb-4">Avis voyageurs</h2>
        <p className="text-sm text-navy/55">Chargement des avis...</p>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="pt-10 border-t border-navy/10">
        <h2 className="font-display font-normal text-2xl text-navy mb-4">Avis voyageurs</h2>
        <div className="border border-navy/10 bg-white p-8 text-center">
          <p className="text-sm text-navy/50">
            Aucun avis pour {villaName} pour le moment. Soyez le premier à partager votre expérience.
          </p>
        </div>
      </section>
    );
  }

  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  // Compute category averages
  const categoryAverages = CATEGORIES.map((cat) => {
    const values = reviews
      .map((r) => r[cat.key] as number | null | undefined)
      .filter((v): v is number => typeof v === "number" && v > 0);
    if (values.length === 0) return null;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { label: cat.label, value: avg };
  }).filter((c): c is { label: string; value: number } => c !== null);

  return (
    <section className="pt-10 border-t border-navy/10">
      <h2 className="font-display font-normal text-2xl text-navy mb-2">
        {avgRating.toFixed(1)} · {reviews.length} avis
      </h2>
      <div className="flex items-center gap-0.5 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= Math.round(avgRating) ? "text-gold fill-gold" : "text-navy/15"}
          />
        ))}
      </div>

      {/* Category bars */}
      {categoryAverages.length > 0 && (
        <div className="mb-8 space-y-2.5 border border-navy/8 bg-white p-5">
          {categoryAverages.map((cat) => (
            <CategoryBar key={cat.label} label={cat.label} value={cat.value} />
          ))}
        </div>
      )}

      <div className="space-y-6">
        {reviews.slice(0, 6).map((review) => (
          <div key={review.id} className="border-b border-navy/5 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <ReviewerAvatar review={review} />
              <div>
                <p className="text-sm font-semibold text-navy">
                  {review.full_name || review.guest_name}
                </p>
                <p className="text-[11px] text-navy/50">
                  {new Date(review.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
                </p>
              </div>
            </div>
            <div className="flex gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  className={star <= review.rating ? "text-gold fill-gold" : "text-navy/10"}
                />
              ))}
            </div>
            {review.comment && <p className="text-sm text-navy/60 leading-relaxed">{review.comment}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
