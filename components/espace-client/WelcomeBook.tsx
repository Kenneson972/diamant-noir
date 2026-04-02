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
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPassword = async () => {
    if (!villa.wifi_password) return;
    try {
      await navigator.clipboard.writeText(villa.wifi_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };

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
        <div className="text-sm text-navy/70 leading-relaxed space-y-3">
          {villa.wifi_name ? (
            <p>
              <span className="font-medium text-navy">Réseau :</span> {villa.wifi_name}
            </p>
          ) : null}
          {villa.wifi_password ? (
            <div>
              <p className="font-medium text-navy mb-2">Mot de passe :</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 border border-navy/10 bg-offwhite px-3 py-1.5 flex-1">
                  <span className="font-mono text-xs text-navy flex-1 select-all">
                    {showPassword ? villa.wifi_password : "•".repeat(villa.wifi_password.length)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-navy/30 hover:text-navy transition-colors"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M2 8s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
                        <path d="M2 2l12 12" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                        <path d="M2 8s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5z" stroke="currentColor" strokeWidth="1" />
                        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={copyPassword}
                  className="text-[9px] font-bold uppercase tracking-[0.15em] border border-navy/15 px-3 py-1.5 text-navy/50 hover:border-gold hover:text-gold transition-colors shrink-0"
                  aria-label="Copier le mot de passe Wi-Fi"
                >
                  {copied ? "Copié ✓" : "Copier"}
                </button>
              </div>
            </div>
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
