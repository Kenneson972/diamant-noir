"use client";

import type { ReactNode } from "react";
import { I18nProvider } from "@heroui/react/rac";

export function EspaceClientProviders({ children }: { children: ReactNode }) {
  return <I18nProvider locale="fr-FR">{children}</I18nProvider>;
}
