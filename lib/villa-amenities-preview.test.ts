import { describe, it, expect } from "vitest";
import { buildAmenitiesPreview } from "./villa-amenities-preview";

describe("buildAmenitiesPreview", () => {
  it("returns empty preview and zero total for empty categories", () => {
    const result = buildAmenitiesPreview({
      interior: [],
      exterior: [],
      servicesHome: [],
      servicesCollection: [],
      aLaCarte: [],
    });
    expect(result).toEqual({ preview: [], total: 0 });
  });

  it("caps the preview at 10 items, prioritizing interior then exterior", () => {
    const result = buildAmenitiesPreview({
      interior: ["Wifi", "Climatisation", "Cuisine", "TV", "Lave-linge", "Baignoire"],
      exterior: ["Piscine", "Jardin", "Terrasse", "Parking", "Barbecue"],
      servicesHome: ["Ménage", "Draps"],
      servicesCollection: [],
      aLaCarte: [],
    });
    expect(result.preview).toHaveLength(10);
    expect(result.preview).toEqual([
      "Wifi", "Climatisation", "Cuisine", "TV", "Lave-linge", "Baignoire",
      "Piscine", "Jardin", "Terrasse", "Parking",
    ]);
    expect(result.total).toBe(13);
  });

  it("fills remaining preview slots from services when interior+exterior are under 10", () => {
    const result = buildAmenitiesPreview({
      interior: ["Wifi", "Climatisation"],
      exterior: ["Piscine"],
      servicesHome: ["Ménage", "Draps"],
      servicesCollection: ["Concierge dédié"],
      aLaCarte: ["Chef privé", "Massage"],
    });
    expect(result.preview).toEqual([
      "Wifi", "Climatisation", "Piscine", "Ménage", "Draps",
      "Concierge dédié", "Chef privé", "Massage",
    ]);
    expect(result.total).toBe(8);
  });

  it("dedupes repeated labels in the preview but still counts them in the total", () => {
    const result = buildAmenitiesPreview({
      interior: ["Wifi"],
      exterior: [],
      servicesHome: [],
      servicesCollection: [],
      aLaCarte: ["Wifi"],
    });
    expect(result.preview).toEqual(["Wifi"]);
    expect(result.total).toBe(2);
  });

  it("ignores empty string entries", () => {
    const result = buildAmenitiesPreview({
      interior: ["Wifi", ""],
      exterior: [],
      servicesHome: [],
      servicesCollection: [],
      aLaCarte: [],
    });
    expect(result.preview).toEqual(["Wifi"]);
    expect(result.total).toBe(2);
  });
});
