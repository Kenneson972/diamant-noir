export type OwnerMessageRow = {
  id: string;
  owner_id: string;
  villa_id: string | null;
  subject: "reversement" | "disponibilites" | "contrat" | "autre";
  content: string;
  sender_role: "owner" | "admin";
  sender_id: string;
  read_at: string | null;
  created_at: string;
};

export type TenantMessageRow = {
  id: string;
  guest_id: string;
  booking_id: string | null;
  subject: "probleme" | "sejour" | "reservation" | "autre";
  content: string;
  sender_role: "guest" | "admin";
  sender_id: string;
  read_at: string | null;
  created_at: string;
};

export type MessageStatusInput = {
  sender_role: string;
  read_at: string | null;
  created_at: string;
};

export type OwnerMessageStatus = "sent" | "read" | "replied";

export function getOwnerMessageStatus(
  message: MessageStatusInput,
  thread: MessageStatusInput[]
): OwnerMessageStatus {
  const hasAdminReplyAfter = thread.some(
    (m) =>
      m.sender_role === "admin" &&
      new Date(m.created_at).getTime() > new Date(message.created_at).getTime()
  );
  if (hasAdminReplyAfter) return "replied";
  if (message.read_at) return "read";
  return "sent";
}
