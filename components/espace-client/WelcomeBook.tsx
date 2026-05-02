"use client";

import { Wifi, LogOut, Star, Phone } from "lucide-react";
import { AccordionDetails, AccordionShell, Card, CardContent } from "@/components/espace-client/tenant-ui";

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
  if (isEmpty(villa)) {
    return (
      <Card className="rounded-none border border-navy/8 bg-white shadow-none">
        <CardContent className="p-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/25">
            Le livret d&apos;accueil sera disponible à l&apos;approche de votre séjour.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 font-display text-xl text-navy">
        <span className="text-gold">◆</span> Livret d&apos;accueil
      </h2>

      <AccordionShell className="rounded-none">
        {villa.wifi_name || villa.wifi_password ? (
          <AccordionDetails
            trigger={
              <>
                <Wifi size={16} className="shrink-0 text-gold" />
                Connexion WiFi
              </>
            }
          >
            <div className="space-y-1">
              {villa.wifi_name && (
                <p>
                  <span className="font-medium text-navy">Réseau :</span> {villa.wifi_name}
                </p>
              )}
              {villa.wifi_password && (
                <p>
                  <span className="font-medium text-navy">Mot de passe :</span>{" "}
                  <code className="rounded border border-navy/10 bg-navy/5 px-2 py-0.5 font-mono text-xs text-navy">
                    {villa.wifi_password}
                  </code>
                </p>
              )}
            </div>
          </AccordionDetails>
        ) : null}

        {villa.checkout_instructions ? (
          <AccordionDetails
            trigger={
              <>
                <LogOut size={16} className="shrink-0 text-gold" />
                Instructions de départ
              </>
            }
          >
            <p className="whitespace-pre-line">{villa.checkout_instructions}</p>
          </AccordionDetails>
        ) : null}

        {villa.local_recommendations ? (
          <AccordionDetails
            trigger={
              <>
                <Star size={16} className="shrink-0 text-gold" />
                Nos recommandations locales
              </>
            }
          >
            <p className="whitespace-pre-line">{villa.local_recommendations}</p>
          </AccordionDetails>
        ) : null}

        {villa.emergency_contacts ? (
          <AccordionDetails
            trigger={
              <>
                <Phone size={16} className="shrink-0 text-gold" />
                Contacts urgence
              </>
            }
          >
            <p className="whitespace-pre-line">{villa.emergency_contacts}</p>
          </AccordionDetails>
        ) : null}
      </AccordionShell>
    </div>
  );
}
