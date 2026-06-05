type EmailFlags = {
  checkin_reminder_sent?: boolean;
  review_request_sent?: boolean;
};

export function readEmailFlags(
  checklistState: Record<string, unknown> | null | undefined
): EmailFlags {
  if (!checklistState || typeof checklistState !== "object") return {};
  return {
    checkin_reminder_sent: Boolean(checklistState._email_checkin_reminder_sent),
    review_request_sent: Boolean(checklistState._email_review_request_sent),
  };
}

export function mergeEmailFlag(
  checklistState: Record<string, unknown> | null | undefined,
  flag: keyof EmailFlags
): Record<string, unknown> {
  const base =
    checklistState && typeof checklistState === "object" ? { ...checklistState } : {};
  if (flag === "checkin_reminder_sent") {
    base._email_checkin_reminder_sent = true;
  }
  if (flag === "review_request_sent") {
    base._email_review_request_sent = true;
  }
  return base;
}
