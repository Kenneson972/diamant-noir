import { describe, it, expect } from "vitest";
import { villaFormReducer, createEmptyForm, sectionCompleteness } from "./villa-editor-state";

describe("villaFormReducer", () => {
  it("SET_FIELD met à jour un champ", () => {
    const s = createEmptyForm();
    const next = villaFormReducer(s, { type: "SET_FIELD", field: "name", value: "Villa" });
    expect(next.name).toBe("Villa");
  });

  it("SET_IMAGES met à jour image_urls et image_url", () => {
    const s = createEmptyForm();
    const next = villaFormReducer(s, { type: "SET_IMAGES", urls: ["a.jpg", "b.jpg"] });
    expect(next.image_urls).toEqual(["a.jpg", "b.jpg"]);
    expect(next.image_url).toBe("a.jpg");
  });

  it("LOAD_VILLA merge une villa existante dans le défaut", () => {
    const s = villaFormReducer(createEmptyForm(), { type: "LOAD_VILLA", villa: { name: "Villa A", price_per_night: 200 } });
    expect(s.name).toBe("Villa A");
    expect(s.price_per_night).toBe(200);
    expect(s.capacity).toBe(2);
  });

  it("SET_ROOMS met à jour rooms_details", () => {
    const s = createEmptyForm();
    const next = villaFormReducer(s, { type: "SET_ROOMS", rooms: [{ name: "Ch1", bed: "King size", ensuite: true }] });
    expect(next.rooms_details).toHaveLength(1);
  });
});

describe("sectionCompleteness", () => {
  it("form vide = infos empty", () => {
    expect(sectionCompleteness(createEmptyForm()).infos).toBe("empty");
  });
  it("nom rempli sans description = infos partial", () => {
    const f = { ...createEmptyForm(), name: "X" };
    expect(sectionCompleteness(f).infos).toBe("partial");
  });
  it("nom + description = infos complete", () => {
    const f = { ...createEmptyForm(), name: "X", description: "Belle villa" };
    expect(sectionCompleteness(f).infos).toBe("complete");
  });
  it("1 photo = photos partial (< 3)", () => {
    const f = { ...createEmptyForm(), image_urls: ["a.jpg"] };
    expect(sectionCompleteness(f).photos).toBe("partial");
  });
  it("3 photos = photos complete", () => {
    const f = { ...createEmptyForm(), image_urls: ["a.jpg", "b.jpg", "c.jpg"] };
    expect(sectionCompleteness(f).photos).toBe("complete");
  });
});
