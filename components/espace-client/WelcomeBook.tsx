"use client";

import { Wifi, LogOut, Star, Phone } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface WelcomeBookProps {
  villa: {
    wifi_name?: string;
    wifi_password?: string;
    checkout_instructions?: string;
    local_recommendations?: string;
    emergency_contacts?: string;
  };
}

const isEmpty = (v: WelcomeBookProps["villa"]) =>
  !v.wifi_name &&
  !v.wifi_password &&
  !v.checkout_instructions &&
  !v.local_recommendations &&
  !v.emergency_contacts;

export function WelcomeBook({ villa }: WelcomeBookProps) {
  const sections: Array<{
    id: "wifi" | "checkout" | "reco" | "emergency";
    title: string;
    icon: React.ReactNode;
    content: React.ReactNode;
    visible: boolean;
  }> = [
    {
      id: "wifi",
      title: "Connexion WiFi",
      icon: <Wifi size={16} className="text-gold shrink-0" />,
      visible: Boolean(villa.wifi_name || villa.wifi_password),
      content: (
        <div className="text-sm text-navy/70 leading-relaxed space-y-1">
          {villa.wifi_name ? (
            <p>
              <span className="font-medium text-navy">Réseau :</span> {villa.wifi_name}
            </p>
          ) : null}
          {villa.wifi_password ? (
            <p>
              <span className="font-medium text-navy">Mot de passe :</span>{" "}
              <code className="bg-navy/5 px-2 py-0.5 rounded text-navy font-mono text-xs border border-navy/10">
                {villa.wifi_password}
              </code>
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: "checkout",
      title: "Instructions de départ",
      icon: <LogOut size={16} className="text-gold shrink-0" />,
      visible: Boolean(villa.checkout_instructions),
      content: <p className="whitespace-pre-line text-sm text-navy/70 leading-relaxed">{villa.checkout_instructions}</p>,
    },
    {
      id: "reco",
      title: "Nos recommandations locales",
      icon: <Star size={16} className="text-gold shrink-0" />,
      visible: Boolean(villa.local_recommendations),
      content: <p className="whitespace-pre-line text-sm text-navy/70 leading-relaxed">{villa.local_recommendations}</p>,
    },
    {
      id: "emergency",
      title: "Contacts urgence",
      icon: <Phone size={16} className="text-gold shrink-0" />,
      visible: Boolean(villa.emergency_contacts),
      content: <p className="whitespace-pre-line text-sm text-navy/70 leading-relaxed">{villa.emergency_contacts}</p>,
    },
  ];

  const visibleSections = sections.filter((s) => s.visible);
  const [openId, setOpenId] = useState<string | null>(visibleSections[0]?.id ?? null);

  if (isEmpty(villa)) {
    return (
      <Card className="border border-navy/8 bg-white shadow-none rounded-none p-6 text-center">
        <CardContent>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/25">
            Le livret d&apos;accueil sera disponible à l&apos;approche de votre séjour.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-navy flex items-center gap-2">
        <span className="text-gold">◆</span> Livret d&apos;accueil
      </h2>

      <div className="border border-navy/8 bg-white rounded-none divide-y divide-navy/5">
        {visibleSections.map((s) => {
          const isOpen = openId === s.id;
          return (
            <div key={s.id}>
              <button
                type="button"
                onClick={() => setOpenId((prev) => (prev === s.id ? null : s.id))}
                className="px-5 py-4 flex items-center gap-3 w-full text-left font-display text-sm text-navy hover:bg-navy/[0.02]"
                aria-expanded={isOpen}
              >
                {s.icon}
                {s.title}
                <span className="ml-auto text-navy/30">{isOpen ? "–" : "+"}</span>
              </button>
              {isOpen ? <div className="px-5 pb-5 pt-1">{s.content}</div> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
