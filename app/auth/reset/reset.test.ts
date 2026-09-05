import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * `SUPABASE_COOKIE_DOMAIN` est lu au chargement du module (const au top-level),
 * donc chaque cas doit poser l'env AVANT un import frais du handler.
 */
async function loadRoute(cookieDomain?: string) {
  vi.resetModules();
  if (cookieDomain) {
    vi.stubEnv("SUPABASE_COOKIE_DOMAIN", cookieDomain);
  } else {
    vi.stubEnv("SUPABASE_COOKIE_DOMAIN", "");
  }
  return import("./route");
}

function requestWith(cookieHeader: string) {
  return new NextRequest("https://kayvila.com/auth/reset", {
    headers: { cookie: cookieHeader },
  });
}

/** Les cookies expirés, indexés par `nom@domaine` (`nom@host-only` si sans domaine). */
function expiredCookies(response: Response) {
  const out = new Map<string, string>();
  for (const raw of response.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split(";").map((s) => s.trim());
    const name = pair.slice(0, pair.indexOf("="));
    const domain = attrs.find((a) => a.toLowerCase().startsWith("domain="));
    const key = `${name}@${domain ? domain.slice("domain=".length) : "host-only"}`;
    out.set(key, raw);
  }
  return out;
}

describe("GET /auth/reset", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://wsdawdxucyuyopkpgjij.supabase.co");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("expire chaque cookie sb-* dans les DEUX portées (host-only + domain-scopée)", async () => {
    const { GET } = await loadRoute("kayvila.com");
    const response = await GET(
      requestWith("sb-wsdawdxucyuyopkpgjij-auth-token=abc; sb-wsdawdxucyuyopkpgjij-auth-token-code-verifier=xyz")
    );

    const cookies = expiredCookies(response);
    // C'est le cœur du correctif : un Set-Cookie d'expiration ne supprime que le
    // cookie dont le (domaine, chemin) correspond exactement. Sans la variante
    // host-only, les cookies écrits avant la bascule c45cf30 survivraient.
    expect([...cookies.keys()].sort()).toEqual([
      "sb-wsdawdxucyuyopkpgjij-auth-token-code-verifier@.kayvila.com",
      "sb-wsdawdxucyuyopkpgjij-auth-token-code-verifier@host-only",
      "sb-wsdawdxucyuyopkpgjij-auth-token@.kayvila.com",
      "sb-wsdawdxucyuyopkpgjij-auth-token@host-only",
    ]);

    for (const raw of cookies.values()) {
      expect(raw).toMatch(/Max-Age=0/i);
      expect(raw).toMatch(/Path=\//i);
    }
  });

  it("purge aussi les cookies découpés en chunks (.0, .1)", async () => {
    const { GET } = await loadRoute("kayvila.com");
    const response = await GET(
      requestWith("sb-wsdawdxucyuyopkpgjij-auth-token.0=part0; sb-wsdawdxucyuyopkpgjij-auth-token.1=part1")
    );

    const names = [...expiredCookies(response).keys()];
    expect(names).toContain("sb-wsdawdxucyuyopkpgjij-auth-token.0@.kayvila.com");
    expect(names).toContain("sb-wsdawdxucyuyopkpgjij-auth-token.1@host-only");
  });

  it("ne touche pas aux cookies non-Supabase", async () => {
    const { GET } = await loadRoute("kayvila.com");
    const response = await GET(
      requestWith("dn_locale=fr; cookie_consent=all; sb-wsdawdxucyuyopkpgjij-auth-token=abc")
    );

    const names = [...expiredCookies(response).keys()];
    expect(names.some((n) => n.startsWith("dn_locale"))).toBe(false);
    expect(names.some((n) => n.startsWith("cookie_consent"))).toBe(false);
    expect(names.some((n) => n.startsWith("sb-"))).toBe(true);
  });

  it("redirige vers /login?reset=1 et interdit la mise en cache", async () => {
    const { GET } = await loadRoute("kayvila.com");
    const response = await GET(requestWith("sb-wsdawdxucyuyopkpgjij-auth-token=abc"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://kayvila.com/login?reset=1");
    // Sans no-store, un cache pourrait resservir le 307 SANS ses Set-Cookie :
    // l'utilisateur serait renvoyé au login sans que rien n'ait été purgé.
    expect(response.headers.get("cache-control")).toMatch(/no-store/);
  });

  it("en local (pas de SUPABASE_COOKIE_DOMAIN) n'émet que la variante host-only", async () => {
    const { GET } = await loadRoute(undefined);
    const response = await GET(requestWith("sb-wsdawdxucyuyopkpgjij-auth-token=abc"));

    expect([...expiredCookies(response).keys()]).toEqual([
      "sb-wsdawdxucyuyopkpgjij-auth-token@host-only",
    ]);
  });
});
