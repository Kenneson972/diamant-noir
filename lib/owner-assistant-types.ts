/**
 * Types partagés — Copilot propriétaire Kayvila
 *
 * Importés par :
 *   - app/api/dashboard/owner-assistant/route.ts
 *   - lib/owner-assistant-context.ts
 *   - app/dashboard/proprio/assistant/page.tsx
 */

// ─── Actions ────────────────────────────────────────────────────────────────

export type OwnerAssistantAction =
  | "SHOW_STATS"
  | "SHOW_CHART"
  | "SHOW_VILLAS"
  | "SHOW_TASKS"
  | "LIST_TASKS"
  | "COMPLETE_TASK"
  | "SHOW_BOOKINGS"
  | "CONFIRM"
  | "SHOW_FINANCES"
  | "SHOW_PLANNING"
  | "SHOW_SUBMISSIONS"
  | "SHOW_OTA_HEALTH";

// ─── Contrat de réponse API ──────────────────────────────────────────────────

export type OwnerAssistantResponse = {
  success: true;
  /** Texte affiché dans le terminal de chat */
  response: string;
  /** Quelle vue activer dans le panneau droit */
  action: OwnerAssistantAction;
  action_data: {
    /** Données structurées passées à la vue active */
    context: Record<string, unknown>;
    /** Alerte prioritaire à afficher en bandeau */
    strategic_alert: {
      severity: "high" | "medium" | "low";
      description: string;
    } | null;
  };
  /** Chips de suggestion affichés sous la bulle assistant */
  suggested_prompts?: string[];
  /** Méta-informations debug (non affichées à l'utilisateur) */
  metadata?: {
    model?: string;
    latency_ms?: number;
    source: "n8n" | "local";
  };
};

// ─── Suggestions statiques (fallback local) ─────────────────────────────────

export const DEFAULT_SUGGESTED_PROMPTS: string[] = [
  "Quels sont mes check-ins cette semaine ?",
  "Combien j'ai encaissé ce mois ?",
  "Y a-t-il des tâches urgentes ?",
  "Donne-moi un résumé de ma semaine",
];
