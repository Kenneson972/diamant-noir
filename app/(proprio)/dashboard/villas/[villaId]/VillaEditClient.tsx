"use client";

import { VillaEditorForm } from "@/components/dashboard/proprio/VillaEditorForm";

interface VillaEditClientProps {
  villa: Record<string, unknown>;
}

export function VillaEditClient({ villa }: VillaEditClientProps) {
  return (
    <VillaEditorForm villa={villa} />
  );
}
