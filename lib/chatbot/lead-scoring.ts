// lib/chatbot/lead-scoring.ts
type LeadSignals = {
  leadTemperature?: string;
  qualificationScore?: number;
  knownLeadData?: {
    checkIn?: string;
    checkOut?: string;
    budget?: number;
    guests?: number;
    [k: string]: unknown;
  };
};

export function isHotLead(s: LeadSignals): boolean {
  if (s.leadTemperature === "hot") return true;
  if (typeof s.qualificationScore === "number" && s.qualificationScore >= 70) return true;
  const d = s.knownLeadData;
  if (d && d.checkIn && typeof d.budget === "number" && d.budget > 0 && typeof d.guests === "number" && d.guests > 0) {
    return true;
  }
  return false;
}
