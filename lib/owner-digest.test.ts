import { describe, it, expect } from "vitest";
import { buildOwnerDigestItem } from "./owner-digest";
import type { OwnerContextPack } from "./owner-assistant-context";

const pack = {
  current_date_iso: "2026-07-05T12:00:00.000Z",
  portfolio: {
    total_villas: 1,
    published_villas: 1,
    total_revenue_paid: 1000,
    revenue_current_month: 500,
    revenue_last_month: 400,
    upcoming_bookings_count: 1,
    pending_tasks_count: 0,
  },
  today: [],
  alerts: [
    {
      id: "a1",
      severity: "high",
      title: "x",
      body: null,
      villa_id: null,
      created_at: "",
      read_at: null,
    },
  ],
  villas: [{ id: "v1", name: "Villa Azur" }],
  bookings: [],
  tasks_open: [],
} as OwnerContextPack;

describe("buildOwnerDigestItem", () => {
  it("structure attendue par le workflow n8n (owner_id à la racine)", () => {
    const item = buildOwnerDigestItem("o1", pack);
    expect(item.owner_id).toBe("o1");
    expect(item.context.alerts_count).toBe(1);
    expect(item.context.portfolio).toBeDefined();
    expect(item.context.insights).toBeDefined();
  });
});
