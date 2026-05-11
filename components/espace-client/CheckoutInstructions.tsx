"use client";

import { Clock, Check } from "lucide-react";

interface CheckoutInstructionsProps {
  endDate: string;
  checkOutTime?: string;
}

const CHECKLIST = [
  "Sortir les poubelles dans le container extérieur",
  "Lancer le lave-vaisselle",
  "Fermer tous les volets et fenêtres",
  "Éteindre la climatisation et les lumières",
  "Déposer les clés dans la boîte à clefs sécurisée",
];

export function CheckoutInstructions({ endDate, checkOutTime = "10:00" }: CheckoutInstructionsProps) {
  const now = new Date();
  const end = new Date(endDate);
  const hoursUntil = (end.getTime() - now.getTime()) / 3600000;
  const isVisible = hoursUntil <= 24 && hoursUntil > 0;
  const isPast = hoursUntil <= 0;

  if (isPast || !isVisible) return null;

  return (
    <div className="border border-gold/10 bg-white p-6 mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-navy/30" />
        <h3 className="font-display text-lg text-navy">Check-out demain</h3>
      </div>
      <p className="text-sm text-navy/50 mb-4">
        Merci de libérer la villa avant <strong>{checkOutTime}</strong>. Voici la checklist de départ :
      </p>
      <ul className="space-y-2 mb-4">
        {CHECKLIST.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-navy/70">
            <Check size={14} className="text-gold mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-navy/30">
        Besoin de rester plus tard ? Faites une demande de late check-out depuis la page Demandes.
      </p>
    </div>
  );
}
