"use client";

import { MapPin, Clock, Phone } from "lucide-react";

interface CheckinGuideProps {
  startDate: string;
  checkInTime?: string;
  digicode?: string;
  checkinImages?: string[];
  address?: string;
  mapEmbedUrl?: string;
}

export function CheckinGuide({
  startDate,
  checkInTime = "17:00",
  digicode,
  checkinImages = [],
  address,
  mapEmbedUrl,
}: CheckinGuideProps) {
  const now = new Date();
  const start = new Date(startDate);
  const hoursUntil = (start.getTime() - now.getTime()) / 3600000;
  const isVisible = hoursUntil <= 24 && hoursUntil > -24;
  const isPast = hoursUntil < -24;
  const isToday = hoursUntil <= 0 && now < new Date(start.getTime() + 86400000);

  if (isPast) {
    return (
      <div className="border border-navy/10 bg-white p-6 mt-8">
        <h3 className="font-display text-lg text-navy mb-2">Check-in</h3>
        <p className="text-sm text-navy/55">Votre séjour est en cours ou terminé.</p>
      </div>
    );
  }

  if (!isVisible && !isToday) {
    const daysUntil = Math.ceil(hoursUntil / 24);
    return (
      <div className="border border-navy/10 bg-white p-6 mt-8">
        <div className="flex items-center gap-2 mb-2">
          <Clock size={16} className="text-navy/30" />
          <h3 className="font-display text-lg text-navy">Check-in</h3>
        </div>
        <p className="text-sm text-navy/50">
          Votre code d&apos;accès et les instructions seront disponibles {daysUntil > 1 ? `dans ${daysUntil} jours` : "demain"}.
        </p>
        <p className="text-[11px] text-navy/30 mt-2">
          Check-in à partir de {checkInTime}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gold/20 bg-white mt-8">
      <div className="border-b border-gold/10 bg-gold/[0.03] px-6 py-4">
        <h3 className="font-display text-lg text-navy">Check-in — {isToday ? "C&apos;est aujourd&apos;hui !" : "Demain"}</h3>
        <p className="text-sm text-navy/50 mt-0.5">À partir de {checkInTime}</p>
      </div>
      <div className="p-6 space-y-6">
        {digicode && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-2">Code d&apos;accès</p>
            <p className="font-display text-3xl tracking-[0.2em] text-navy">{digicode}</p>
          </div>
        )}
        {checkinImages.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-navy/50 mb-3">Photos d&apos;accès</p>
            <div className="grid grid-cols-2 gap-2">
              {checkinImages.map((url, i) => (
                <img key={i} src={url} alt={`Accès étape ${i + 1}`} className="w-full aspect-[4/3] object-cover border border-navy/10" />
              ))}
            </div>
          </div>
        )}
        {address && (
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-navy/30 mt-0.5 shrink-0" />
            <p className="text-sm text-navy/70">{address}</p>
          </div>
        )}
        {mapEmbedUrl && (
          <div className="aspect-[16/7] overflow-hidden border border-navy/10">
            <iframe src={mapEmbedUrl} title="Itinéraire" className="w-full h-full" loading="lazy" />
          </div>
        )}
        <a
          href="tel:+596696000000"
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/60 hover:text-navy transition-colors"
        >
          <Phone size={14} />
          Problème d&apos;accès ? Appelez-nous
        </a>
      </div>
    </div>
  );
}
