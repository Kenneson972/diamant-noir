import { describe, it, expect } from "vitest";
import { corsHeaders } from "./cors";

describe("corsHeaders", () => {
  it("n'utilise jamais le wildcard *", () => {
    const h = corsHeaders("GET, OPTIONS");
    expect(h["Access-Control-Allow-Origin"]).not.toBe("*");
  });

  it("renvoie l'origine explicite et les méthodes passées", () => {
    const h = corsHeaders("POST, OPTIONS");
    expect(h["Access-Control-Allow-Origin"]).toMatch(/^https?:\/\//);
    expect(h["Access-Control-Allow-Methods"]).toBe("POST, OPTIONS");
    expect(h["Access-Control-Allow-Headers"]).toContain("Content-Type");
  });
});
