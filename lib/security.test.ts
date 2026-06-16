import { describe, it, expect } from "vitest";
import { escapeHtml } from "./security";

describe("escapeHtml", () => {
  it("neutralise les balises et guillemets", () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
    expect(escapeHtml('a"b\'c&d')).toBe("a&quot;b&#39;c&amp;d");
  });
  it("gère null/undefined sans planter", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});
