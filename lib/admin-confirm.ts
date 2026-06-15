// lib/admin-confirm.ts
const DESTRUCTIVE = new Set(["BLOCK_DATE", "UPDATE_BOOKING", "UPDATE_SUBMISSION_STATUS"]);

export function requiresConfirmation(action: string, actionData: Record<string, unknown>): boolean {
  if (!DESTRUCTIVE.has(action)) return false;
  return actionData?.confirm !== true;
}

export function buildConfirmationPrompt(action: string, actionData: Record<string, unknown>): string {
  switch (action) {
    case "BLOCK_DATE": {
      const b = (actionData.block ?? {}) as { start_date?: string; end_date?: string };
      return `Confirmer le blocage des dates du ${b.start_date ?? "?"} au ${b.end_date ?? "?"} ?`;
    }
    case "UPDATE_BOOKING":
      return `Confirmer la modification de la réservation ${String(actionData.booking_id ?? "")} ?`;
    case "UPDATE_SUBMISSION_STATUS":
      return `Confirmer le changement de statut de la soumission ${String(actionData.submission_id ?? "")} vers « ${String(actionData.status ?? "")} » ?`;
    default:
      return "Confirmer cette action ?";
  }
}
