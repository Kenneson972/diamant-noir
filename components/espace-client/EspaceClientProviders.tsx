"use client";

import type { ReactNode } from "react";

/** Ancien enveloppe `@heroui/react/rac` I18nProvider — retirée avec HeroUI ; les dates restent formatées en `fr-FR` côté composants. */
export function EspaceClientProviders({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
