// app/api/chat/pre-book/validate.test.ts
import { describe, it, expect } from "vitest";
import { validatePreBook } from "@/lib/chatbot/pre-book";

const VID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const VID2 = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

describe("validatePreBook", () => {
  it("rejette si villaId ou email manquant", () => {
    expect(validatePreBook({ villaId: "", email: "a@b.com", startDate: "2026-07-01", endDate: "2026-07-05" }).ok).toBe(false);
    expect(validatePreBook({ villaId: VID, email: "", startDate: "2026-07-01", endDate: "2026-07-05" }).ok).toBe(false);
  });
  it("rejette un villaId non UUID", () => {
    expect(validatePreBook({ villaId: "v1", email: "a@b.com", startDate: "2026-07-01", endDate: "2026-07-05" }).ok).toBe(false);
  });
  it("rejette un email invalide", () => {
    expect(validatePreBook({ villaId: VID, email: "nope", startDate: "2026-07-01", endDate: "2026-07-05" }).ok).toBe(false);
  });
  it("rejette si end <= start", () => {
    expect(validatePreBook({ villaId: VID, email: "a@b.com", startDate: "2026-07-05", endDate: "2026-07-05" }).ok).toBe(false);
  });
  it("accepte un payload valide et normalise guests", () => {
    const r = validatePreBook({ villaId: VID2, email: "a@b.com", startDate: "2026-07-01", endDate: "2026-07-05", guests: "3" as unknown as number });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.guests).toBe(3);
  });
});
