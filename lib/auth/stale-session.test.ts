import { describe, it, expect } from "vitest";
import {
  isStaleAuthError,
  buildAuthCookiePurge,
  normalizeCookieDomain,
} from "./stale-session";

describe("isStaleAuthError", () => {
  it("reconnaît les erreurs gotrue observées en production", () => {
    // Messages relevés dans les auth_logs Supabase du 2026-09-05.
    expect(isStaleAuthError({ message: "Invalid Refresh Token: Refresh Token Not Found" })).toBe(true);
    expect(isStaleAuthError({ message: "crypto: refresh token length is not valid" })).toBe(true);
    expect(isStaleAuthError({ code: "refresh_token_not_found" })).toBe(true);
    expect(isStaleAuthError({ code: "session_not_found" })).toBe(true);
  });

  it("ne se déclenche pas sur l'absence d'erreur ni sur une panne réseau", () => {
    expect(isStaleAuthError(null)).toBe(false);
    expect(isStaleAuthError(undefined)).toBe(false);
    // Purger sur une erreur transitoire déconnecterait un utilisateur valide.
    expect(isStaleAuthError({ message: "Failed to fetch" })).toBe(false);
    expect(isStaleAuthError({ message: "Request rate limit reached", status: 429 })).toBe(false);
  });
});

describe("buildAuthCookiePurge", () => {
  const NAMES = ["sb-ref-auth-token", "sb-ref-auth-token-code-verifier"];

  it("émet les DEUX portées quand un domaine est configuré", () => {
    const headers = buildAuthCookiePurge(NAMES, { domain: ".kayvila.com", secure: true });
    expect(headers).toHaveLength(4);

    const hostOnly = headers.filter((h) => !h.includes("Domain="));
    const scoped = headers.filter((h) => h.includes("Domain=.kayvila.com"));
    // Sans la variante host-only, les cookies écrits avant c45cf30 survivraient.
    expect(hostOnly).toHaveLength(2);
    expect(scoped).toHaveLength(2);
  });

  it("expire réellement les cookies", () => {
    for (const h of buildAuthCookiePurge(NAMES, { domain: ".kayvila.com", secure: true })) {
      expect(h).toContain("Max-Age=0");
      expect(h).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT");
      expect(h).toContain("Path=/");
    }
  });

  it("n'ajoute Secure qu'en https (sinon le cookie est rejeté en local)", () => {
    const https = buildAuthCookiePurge(["sb-ref-auth-token"], { secure: true });
    const http = buildAuthCookiePurge(["sb-ref-auth-token"], { secure: false });
    expect(https.every((h) => h.includes("Secure"))).toBe(true);
    expect(http.every((h) => !h.includes("Secure"))).toBe(true);
  });

  it("ignore les cookies non-Supabase", () => {
    const headers = buildAuthCookiePurge(["dn_locale", "cookie_consent", "sb-ref-auth-token"], {
      secure: true,
    });
    expect(headers).toHaveLength(1);
    expect(headers[0]).toContain("sb-ref-auth-token=");
  });

  it("couvre les cookies découpés en chunks", () => {
    const headers = buildAuthCookiePurge(["sb-ref-auth-token.0", "sb-ref-auth-token.1"], {
      domain: ".kayvila.com",
      secure: true,
    });
    expect(headers).toHaveLength(4);
    expect(headers.some((h) => h.startsWith("sb-ref-auth-token.1="))).toBe(true);
  });

  it("sans domaine configuré (local), n'émet que la variante host-only", () => {
    expect(buildAuthCookiePurge(["sb-ref-auth-token"], { secure: false })).toHaveLength(1);
  });
});

describe("normalizeCookieDomain", () => {
  it("préfixe d'un point pour couvrir les sous-domaines, sans le doubler", () => {
    expect(normalizeCookieDomain("kayvila.com")).toBe(".kayvila.com");
    expect(normalizeCookieDomain(".kayvila.com")).toBe(".kayvila.com");
  });

  it("reste indéfini en local pour garder le comportement host-only", () => {
    expect(normalizeCookieDomain(undefined)).toBeUndefined();
    expect(normalizeCookieDomain("")).toBeUndefined();
  });
});
