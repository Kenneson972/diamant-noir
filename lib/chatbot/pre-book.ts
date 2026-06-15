// lib/chatbot/pre-book.ts
export type PreBookInput = {
  villaId: string;
  email: string;
  startDate: string;
  endDate: string;
  guests?: number;
  name?: string;
  sessionId?: string;
};

export type PreBookResult =
  | { ok: true; value: Required<Pick<PreBookInput, "villaId" | "email" | "startDate" | "endDate">> & { guests: number; name: string | null; sessionId: string | null } }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePreBook(input: Partial<PreBookInput>): PreBookResult {
  const villaId = String(input.villaId ?? "").trim();
  const email = String(input.email ?? "").trim();
  const startDate = String(input.startDate ?? "").trim();
  const endDate = String(input.endDate ?? "").trim();

  if (!villaId) return { ok: false, error: "villaId requis" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "email invalide" };
  if (!startDate || !endDate) return { ok: false, error: "dates requises" };
  if (endDate <= startDate) return { ok: false, error: "endDate doit être après startDate" };

  const guestsNum = Number(input.guests ?? 1);
  const guests = Number.isFinite(guestsNum) && guestsNum > 0 ? Math.floor(guestsNum) : 1;

  return {
    ok: true,
    value: {
      villaId,
      email,
      startDate,
      endDate,
      guests,
      name: input.name ? String(input.name).slice(0, 120) : null,
      sessionId: input.sessionId ? String(input.sessionId).slice(0, 80) : null,
    },
  };
}
