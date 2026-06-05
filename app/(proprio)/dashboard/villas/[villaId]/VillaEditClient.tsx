"use client";

import { VillaEditorForm } from "@/components/dashboard/proprio/VillaEditorForm";
import { VillaIcalPanel } from "@/components/dashboard/proprio/VillaIcalPanel";

type OTAChannel = {
  source: string;
  ical_url: string;
  label?: string;
};

interface VillaEditClientProps {
  villa: Record<string, unknown>;
}

export function VillaEditClient({ villa }: VillaEditClientProps) {
  const villaId = villa.id as string;
  const icalUrl = (villa.ical_url as string | null) ?? null;
  const otaChannels = (villa.ota_channels as OTAChannel[] | null) ?? null;

  return (
    <div className="space-y-8">
      <VillaEditorForm villa={villa} />
      <VillaIcalPanel villaId={villaId} icalUrl={icalUrl} otaChannels={otaChannels} />
    </div>
  );
}
