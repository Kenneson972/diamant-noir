"use client";

import { useState } from "react";
import { VillaAmenitiesEditor } from "./VillaAmenitiesEditor";

interface VillaAmenitiesEditorWrapperProps {
  villaId: string;
  initialAmenities: string[];
}

export function VillaAmenitiesEditorWrapper({
  villaId: _villaId,
  initialAmenities,
}: VillaAmenitiesEditorWrapperProps) {
  const [amenities, setAmenities] = useState<string[]>(initialAmenities);
  const [draft, setDraft] = useState("");

  return (
    <VillaAmenitiesEditor
      amenities={amenities}
      amenitiesImportLabels={[]}
      onChange={setAmenities}
      draft={draft}
      onDraftChange={setDraft}
    />
  );
}
