// lib/sla.ts
export type Priority = "standard" | "urgent";

const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function slaThresholds(priority: Priority) {
  if (priority === "urgent") {
    return {
      takenHours: num(process.env.NEXT_PUBLIC_SLA_URGENT_TAKEN_HOURS, 2),
      resolveHours: num(process.env.NEXT_PUBLIC_SLA_URGENT_RESOLVE_HOURS, 24),
    };
  }
  return {
    takenHours: num(process.env.NEXT_PUBLIC_SLA_STANDARD_TAKEN_HOURS, 8),
    resolveHours: num(process.env.NEXT_PUBLIC_SLA_STANDARD_RESOLVE_HOURS, 48),
  };
}

export const slaReminderHours = () => num(process.env.NEXT_PUBLIC_SLA_STANDARD_REMINDER_HOURS, 6);
export const slaWarnPercent = () => num(process.env.NEXT_PUBLIC_SLA_WARN_PERCENT, 75);

export type SlaInput = {
  createdAt: string;
  priority: Priority;
  resolvedAt?: string | null;
};

export type SlaStatus = {
  level: "ok" | "warn" | "over";
  elapsedHours: number;
  ratio: number;
};

export function getSlaStatus(input: SlaInput, now: Date = new Date()): SlaStatus {
  if (input.resolvedAt) return { level: "ok", elapsedHours: 0, ratio: 0 };
  const { resolveHours } = slaThresholds(input.priority);
  const elapsedHours = (now.getTime() - new Date(input.createdAt).getTime()) / 3600_000;
  const ratio = elapsedHours / resolveHours;
  const warn = slaWarnPercent() / 100;
  const level = ratio >= 1 ? "over" : ratio >= warn ? "warn" : "ok";
  return { level, elapsedHours, ratio };
}
