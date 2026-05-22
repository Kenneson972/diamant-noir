"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

interface Review {
  id: string;
  guest_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function VillaReviews({ villaId, villaName }: { villaId: string; villaName: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/reviews?villa_id=${villaId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReviews(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [villaId]);

  if (loading) {
    return (
      <section className="pt-10 border-t border-navy/10">
        <h2 className="font-display font-normal text-2xl text-navy mb-4">Avis voyageurs</h2>
        <p className="text-sm text-navy/40">Chargement des avis...</p>
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

  const avgRating =
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section className="pt-10 border-t border-navy/10">
      <h2 className="font-display font-normal text-2xl text-navy mb-2">
        {avgRating.toFixed(1)} · {reviews.length} avis
      </h2>
      <div className="flex items-center gap-0.5 mb-8">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= Math.round(avgRating) ? "text-gold fill-gold" : "text-navy/15"}
          />
        ))}
      </div>
      <div className="space-y-6">
        {reviews.slice(0, 6).map((review) => (
          <div key={review.id} className="border-b border-navy/5 pb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-xs font-bold text-navy uppercase">
                {review.guest_name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-navy">{review.guest_name}</p>
                <p className="text-[11px] text-navy/35">
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
