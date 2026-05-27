"use client";

import { useState } from "react";
import { VillaAmenitiesEditor } from "./VillaAmenitiesEditor";

interface VillaAmenitiesEditorWrapperProps {
  villaId: string;
  initialAmenities: string[];
  onAmenitiesChange?: (amenities: string[]) => void;
}

export function VillaAmenitiesEditorWrapper({
  villaId: _villaId,
  initialAmenities,
  onAmenitiesChange,
}: VillaAmenitiesEditorWrapperProps) {
  const [amenities, setAmenities] = useState<string[]>(initialAmenities);

  const handleAmenitiesChange = (a: string[]) => {
    setAmenities(a);
    onAmenitiesChange?.(a);
  };
  const [draft, setDraft] = useState("");

  return (
    <VillaAmenitiesEditor
      amenities={amenities}
      amenitiesImportLabels={[]}
      onChange={handleAmenitiesChange}
      draft={draft}
      onDraftChange={setDraft}
    />
  );
}
