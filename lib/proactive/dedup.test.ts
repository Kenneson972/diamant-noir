import { describe, it, expect } from "vitest";
import { diffNewRefIds } from "@/lib/proactive/dedup";

describe("diffNewRefIds", () => {
  it("retourne seulement les ids absents du set existant", () => {
    expect(diffNewRefIds(new Set(["a"]), ["a", "b", "c"])).toEqual(["b", "c"]);
  });
  it("liste vide si tous déjà alertés", () => {
    expect(diffNewRefIds(new Set(["a", "b"]), ["a", "b"])).toEqual([]);
  });
  it("retourne tous les ids si set vide", () => {
    expect(diffNewRefIds(new Set([]), ["a", "b"])).toEqual(["a", "b"]);
  });
});
