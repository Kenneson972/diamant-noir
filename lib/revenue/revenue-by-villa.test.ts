import { describe, it, expect } from "vitest";
import { revenueByVilla } from "./revenue-by-villa";

describe("revenueByVilla", () => {
  it("groups gross revenue by villa and sorts desc", () => {
    const bookings = [
      { villa_id: "a", villa_name: "Villa A", price: 1000, cleaning_fee: 100, service_fee: 0, total_price_cents: null },
      { villa_id: "b", villa_name: "Villa B", price: 500, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
      { villa_id: "a", villa_name: "Villa A", price: 200, cleaning_fee: 0, service_fee: 0, total_price_cents: null },
    ];
    const result = revenueByVilla(bookings);
    expect(result).toEqual([
      { villaId: "a", villaName: "Villa A", grossCents: 130000, bookingsCount: 2 },
      { villaId: "b", villaName: "Villa B", grossCents: 50000, bookingsCount: 1 },
    ]);
  });

  it("returns empty array for no bookings", () => {
    expect(revenueByVilla([])).toEqual([]);
  });
});
