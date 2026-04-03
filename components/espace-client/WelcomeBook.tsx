"use client";

import { Wifi, LogOut, Star, Phone } from "lucide-react";
import { Accordion, Card } from "@heroui/react";

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
      <Card className="border border-navy/8 bg-white shadow-none rounded-none p-6 text-center">
        <Card.Content>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/25">
            Le livret d&apos;accueil sera disponible à l&apos;approche de votre séjour.
          </p>
        </Card.Content>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-display text-xl text-navy flex items-center gap-2">
        <span className="text-gold">◆</span> Livret d&apos;accueil
      </h2>

      <Accordion variant="default" className="border border-navy/8 bg-white rounded-none divide-y divide-navy/5">
        {(villa.wifi_name || villa.wifi_password) ? (
          <Accordion.Item>
            <Accordion.Heading>
              <Accordion.Trigger className="px-5 py-4 flex items-center gap-3 w-full text-left font-display text-sm text-navy hover:bg-navy/[0.02]">
                <Wifi size={16} className="text-gold shrink-0" />
                Connexion WiFi
                <Accordion.Indicator className="ml-auto" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="px-5 pb-5 pt-1 text-sm text-navy/70 leading-relaxed space-y-1">
                {villa.wifi_name && (
                  <p>
                    <span className="font-medium text-navy">Réseau :</span> {villa.wifi_name}
                  </p>
                )}
                {villa.wifi_password && (
                  <p>
                    <span className="font-medium text-navy">Mot de passe :</span>{" "}
                    <code className="bg-navy/5 px-2 py-0.5 rounded text-navy font-mono text-xs border border-navy/10">
                      {villa.wifi_password}
                    </code>
                  </p>
                )}
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ) : null}

        {villa.checkout_instructions ? (
          <Accordion.Item>
            <Accordion.Heading>
              <Accordion.Trigger className="px-5 py-4 flex items-center gap-3 w-full text-left font-display text-sm text-navy hover:bg-navy/[0.02]">
                <LogOut size={16} className="text-gold shrink-0" />
                Instructions de départ
                <Accordion.Indicator className="ml-auto" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="px-5 pb-5 pt-1 text-sm text-navy/70 leading-relaxed">
                <p className="whitespace-pre-line">{villa.checkout_instructions}</p>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ) : null}

        {villa.local_recommendations ? (
          <Accordion.Item>
            <Accordion.Heading>
              <Accordion.Trigger className="px-5 py-4 flex items-center gap-3 w-full text-left font-display text-sm text-navy hover:bg-navy/[0.02]">
                <Star size={16} className="text-gold shrink-0" />
                Nos recommandations locales
                <Accordion.Indicator className="ml-auto" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="px-5 pb-5 pt-1 text-sm text-navy/70 leading-relaxed">
                <p className="whitespace-pre-line">{villa.local_recommendations}</p>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ) : null}

        {villa.emergency_contacts ? (
          <Accordion.Item>
            <Accordion.Heading>
              <Accordion.Trigger className="px-5 py-4 flex items-center gap-3 w-full text-left font-display text-sm text-navy hover:bg-navy/[0.02]">
                <Phone size={16} className="text-gold shrink-0" />
                Contacts urgence
                <Accordion.Indicator className="ml-auto" />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel>
              <Accordion.Body className="px-5 pb-5 pt-1 text-sm text-navy/70 leading-relaxed">
                <p className="whitespace-pre-line">{villa.emergency_contacts}</p>
              </Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        ) : null}
      </Accordion>
    </div>
  );
}
