// lib/admin-confirm.test.ts
import { describe, it, expect } from "vitest";
import { requiresConfirmation, buildConfirmationPrompt } from "./admin-confirm";

describe("requiresConfirmation", () => {
  it("exige confirmation pour actions destructives non confirmées", () => {
    expect(requiresConfirmation("BLOCK_DATE", {})).toBe(true);
    expect(requiresConfirmation("UPDATE_BOOKING", {})).toBe(true);
    expect(requiresConfirmation("UPDATE_SUBMISSION_STATUS", {})).toBe(true);
  });
  it("laisse passer si confirm=true", () => {
    expect(requiresConfirmation("BLOCK_DATE", { confirm: true })).toBe(false);
  });
  it("ne bloque jamais les actions non destructives", () => {
    expect(requiresConfirmation("CREATE_TASK", {})).toBe(false);
    expect(requiresConfirmation("COMPLETE_TASK", {})).toBe(false);
    expect(requiresConfirmation("SHOW_STATS", {})).toBe(false);
  });
});

describe("buildConfirmationPrompt", () => {
  it("formule une question lisible pour BLOCK_DATE", () => {
    const p = buildConfirmationPrompt("BLOCK_DATE", { block: { start_date: "2026-07-15", end_date: "2026-07-20" } });
    expect(p).toContain("2026-07-15");
  });
});
