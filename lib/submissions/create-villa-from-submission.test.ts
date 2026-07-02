import { describe, it, expect } from "vitest";
import { mapSubmissionToVilla } from "./create-villa-from-submission";

const base = {
  name: "Jean Proprio",
  email: "jean@test.com",
  villa_name: "Villa Azur",
  villa_location: "Trois-Îlets",
  adresse_postale: "12 rue des Cocotiers",
  chambres: "3",
  salles_de_bains: "2 sdb",
  surface: "180",
  equipements: ["Piscine", "Wi-Fi", "Climatisation", "Jardin"],
  photo_urls: ["https://x/a.jpg", "https://x/b.jpg"],
  airbnb_url: "https://airbnb.fr/rooms/1",
  message: "Belle villa familiale",
  villa_description: "Type: villa | Surface: 180 m²",
};

describe("mapSubmissionToVilla", () => {
  it("mappe les champs de base", () => {
    const v = mapSubmissionToVilla(base);
    expect(v.name).toBe("Villa Azur");
    expect(v.location).toBe("Trois-Îlets");
    expect(v.bedrooms).toBe(3);
    expect(v.bathrooms_count).toBe(2);
    expect(v.surface_m2).toBe(180);
    expect(v.capacity).toBe(6);
    expect(v.airbnb_url).toBe("https://airbnb.fr/rooms/1");
    expect(v.is_published).toBe(false);
    expect(v.price_per_night).toBe(0);
  });

  it("répartit les équipements intérieur/extérieur", () => {
    const v = mapSubmissionToVilla(base);
    expect(v.equipment_exterior).toEqual(["Piscine", "Jardin"]);
    expect(v.equipment_interior).toEqual(["Wi-Fi", "Climatisation"]);
  });

  it("photos → image_urls + image_url (cover)", () => {
    const v = mapSubmissionToVilla(base);
    expect(v.image_urls).toEqual(["https://x/a.jpg", "https://x/b.jpg"]);
    expect(v.image_url).toBe("https://x/a.jpg");
  });

  it("fallbacks : nom depuis le proprio, localisation depuis l'adresse, parse tolérant", () => {
    const v = mapSubmissionToVilla({ name: "Jean Proprio", email: "j@t.com", chambres: "pas un nombre" });
    expect(v.name).toBe("Villa de Jean Proprio");
    expect(v.bedrooms).toBe(0);
    expect(v.capacity).toBe(2);
    expect(v.image_urls).toEqual([]);
    const v2 = mapSubmissionToVilla({ name: "J", email: "j@t.com", adresse_postale: "12 rue X" });
    expect(v2.location).toBe("12 rue X");
  });

  it("description = message + résumé technique, jamais de champs interdits", () => {
    const v = mapSubmissionToVilla(base);
    expect(v.description).toContain("Belle villa familiale");
    expect(v.description).toContain("Type: villa");
    expect("collection_tier" in v).toBe(false);
    expect("cancellation_template" in v).toBe(false);
    expect("owner_id" in v).toBe(false);
  });
});
