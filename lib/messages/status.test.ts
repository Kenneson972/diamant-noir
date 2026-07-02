import { describe, it, expect } from "vitest";
import { getOwnerMessageStatus, type OwnerMessageRow, type TenantMessageRow } from "./status";

function makeMessage(overrides: Partial<OwnerMessageRow>): OwnerMessageRow {
  return {
    id: "m1",
    owner_id: "owner-1",
    villa_id: null,
    subject: "autre",
    content: "test",
    sender_role: "owner",
    sender_id: "owner-1",
    read_at: null,
    created_at: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

describe("getOwnerMessageStatus", () => {
  it("returns 'sent' when unread and no admin reply", () => {
    const message = makeMessage({ read_at: null });
    expect(getOwnerMessageStatus(message, [message])).toBe("sent");
  });

  it("returns 'read' when read_at is set and no admin reply after", () => {
    const message = makeMessage({ read_at: "2026-07-01T10:05:00.000Z" });
    expect(getOwnerMessageStatus(message, [message])).toBe("read");
  });

  it("returns 'replied' when an admin message exists after this one, even if read_at is null", () => {
    const message = makeMessage({ id: "m1", read_at: null, created_at: "2026-07-01T10:00:00.000Z" });
    const adminReply = makeMessage({
      id: "m2",
      sender_role: "admin",
      sender_id: "admin-1",
      created_at: "2026-07-01T11:00:00.000Z",
    });
    expect(getOwnerMessageStatus(message, [message, adminReply])).toBe("replied");
  });

  it("returns 'read' (not 'replied') when the admin message is before this one", () => {
    const adminReply = makeMessage({
      id: "m0",
      sender_role: "admin",
      sender_id: "admin-1",
      created_at: "2026-07-01T09:00:00.000Z",
    });
    const message = makeMessage({
      id: "m1",
      read_at: "2026-07-01T10:05:00.000Z",
      created_at: "2026-07-01T10:00:00.000Z",
    });
    expect(getOwnerMessageStatus(message, [adminReply, message])).toBe("read");
  });

  it("accepts a tenant message row (sender_role 'guest') without a type error", () => {
    const tenantMessage: TenantMessageRow = {
      id: "t1",
      guest_id: "guest-1",
      booking_id: null,
      subject: "autre",
      content: "test",
      sender_role: "guest",
      sender_id: "guest-1",
      read_at: null,
      created_at: "2026-07-01T10:00:00.000Z",
    };
    expect(getOwnerMessageStatus(tenantMessage, [tenantMessage])).toBe("sent");
  });
});
