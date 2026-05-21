"use client";

import { VillaEditorForm } from "@/components/dashboard/proprio/VillaEditorForm";

interface VillaEditClientProps {
  villa: Record<string, unknown>;
}

export function VillaEditClient({ villa }: VillaEditClientProps) {
  return (
    <div className="space-y-6">
      {/* Read-only cleaning fee display */}
      <div className="flex items-center justify-between rounded-lg border border-navy/10 bg-white px-4 py-3 text-sm">
        <span className="text-navy/60">Frais de ménage</span>
        <span className="font-medium text-navy">
          {villa.cleaning_fee_cents != null
            ? `${((villa.cleaning_fee_cents as number) / 100).toFixed(2).replace(".", ",")} EUR`
            : "\u2014"}
        </span>
      </div>
      <VillaEditorForm villa={villa} />
    </div>
  );
}
