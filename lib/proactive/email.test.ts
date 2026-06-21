import { describe, it, expect } from "vitest";
import { renderList } from "@/lib/emails/admin-proactive";

describe("renderList", () => {
  it("génère un bloc HTML avec titre et items, échappe le texte", () => {
    const html = renderList("Soumissions", ["Villa <X>", "Villa Y"]);
    expect(html).toContain("<h3");
    expect(html).toContain("Soumissions");
    expect(html).toContain("Villa &lt;X&gt;");
    expect(html).toContain("Villa Y");
  });
  it("retourne chaîne vide si aucun item", () => {
    expect(renderList("T", [])).toBe("");
  });
  it("échappe les guillemets", () => {
    const html = renderList("A", ["L'hôtel & Spa"]);
    expect(html).toContain("L&#39;hôtel");
    expect(html).toContain("&amp; Spa");
  });
});
