import { describe, it, expect } from "vitest";
import { detectOTASource } from "./ota-hub";

describe("detectOTASource", () => {
  it('URL contenant "airbnb.com" → "airbnb"', () => {
    expect(detectOTASource("https://www.airbnb.com/rooms/123")).toBe("airbnb");
  });

  it('URL contenant "booking.com" → "booking"', () => {
    expect(detectOTASource("https://booking.com/hotel/fr/villa")).toBe("booking");
  });

  it('URL contenant "expedia.com" → "expedia"', () => {
    expect(detectOTASource("https://www.expedia.com/martinique/villa")).toBe("expedia");
  });

  it('URL contenant "vrbo.com" → "vrbo"', () => {
    expect(detectOTASource("https://www.vrbo.com/fr-fr/location/abc")).toBe("vrbo");
  });

  it('URL contenant "trivago.com" → "trivago"', () => {
    expect(detectOTASource("https://www.trivago.com/martinique")).toBe("trivago");
  });

  it("URL inconnue → direct", () => {
    expect(detectOTASource("https://kayvila.com/villas/abc")).toBe("direct");
  });
});
