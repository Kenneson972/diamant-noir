import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { escapeHtml, verifyOrigin } from "./security";

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

describe("verifyOrigin", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  function req(headers: Record<string, string>) {
    return new Request("https://example.test/api/x", { headers });
  }

  it("accepte une requête same-origin même si NEXT_PUBLIC_BASE_URL pointe vers un autre domaine (régression update-villa)", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://kayvila.com");
    const request = req({
      host: "kayvila.vercel.app",
      referer: "https://kayvila.vercel.app/admin/villas/123",
    });
    expect(verifyOrigin(request)).toBe(true);
  });

  it("accepte via Origin quand il correspond au Host", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://kayvila.com");
    const request = req({
      host: "kayvila.vercel.app",
      origin: "https://kayvila.vercel.app",
    });
    expect(verifyOrigin(request)).toBe(true);
  });

  it("accepte aussi via NEXT_PUBLIC_BASE_URL quand il correspond (domaine final branché)", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://kayvila.com");
    const request = req({
      host: "kayvila.com",
      origin: "https://kayvila.com",
    });
    expect(verifyOrigin(request)).toBe(true);
  });

  it("refuse une origine réellement étrangère", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://kayvila.com");
    const request = req({
      host: "kayvila.vercel.app",
      origin: "https://evil-attacker.example",
    });
    expect(verifyOrigin(request)).toBe(false);
  });

  it("refuse quand aucun Origin/Referer n'est fourni", () => {
    vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://kayvila.com");
    const request = req({ host: "kayvila.vercel.app" });
    expect(verifyOrigin(request)).toBe(false);
  });
});
