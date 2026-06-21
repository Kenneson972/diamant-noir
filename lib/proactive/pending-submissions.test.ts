import { describe, it, expect } from "vitest";
import { decidePendingSubmissions } from "@/lib/proactive/pending-submissions";

const now = new Date("2026-06-21T12:00:00Z");

describe("decidePendingSubmissions", () => {
  it("garde celles créées il y a plus de 48h", () => {
    const rows = [
      { id: "1", villa_name: "Azur", created_at: "2026-06-19T00:00:00Z" },
      { id: "2", villa_name: "Corail", created_at: "2026-06-21T00:00:00Z" },
    ];
    const out = decidePendingSubmissions(rows, now);
    expect(out.map((o) => o.id)).toEqual(["1"]);
    expect(out[0].villa).toBe("Azur");
    expect(out[0].since).toBe("2026-06-19");
  });
  it("retourne vide si aucune >48h", () => {
    const rows = [{ id: "1", villa_name: "X", created_at: "2026-06-21T00:00:00Z" }];
    expect(decidePendingSubmissions(rows, now)).toEqual([]);
  });
});
