// ═══ Constantes partagées Kayvila — types, statuts, configs ═══

/* ─── Types de demandes ─────────────────────────────────── */
export const REQUEST_TYPE_LABELS: Record<string, string> = {
  early_checkin: "Early check-in",
  late_checkout: "Late check-out",
  date_change: "Modification de dates",
  issue: "Problème signalé",
  service: "Service ponctuel",
  cancellation: "Demande d'annulation",
  other: "Autre",
};

/* ─── Statuts de demandes ───────────────────────────────── */
export const REQUEST_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  in_progress: "En cours",
  resolved: "Résolu",
  rejected: "Refusé",
};

/* ─── Statuts de réservations ────────────────────────────── */
export const BOOKING_STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-gray-50 text-gray-500 border-gray-200",
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  paid: "Payée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

/* ─── Statuts de parrainage ──────────────────────────────── */
export const REFERRAL_STATUS_STYLES: Record<string, string> = {
  invited: "bg-amber-50 text-amber-700",
  registered: "bg-blue-50 text-blue-700",
  booked: "bg-emerald-50 text-emerald-700",
};

export const REFERRAL_STATUS_LABELS: Record<string, string> = {
  invited: "Invité",
  registered: "Inscrit",
  booked: "A réservé",
};

/* ─── Types de notifications (icônes en string) ──────────── */
export const NOTIF_TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  villa_submission:   { icon: "Building2",     color: "text-gold",        bg: "bg-gold/10" },
  booking_new:        { icon: "Calendar",      color: "text-blue-500",    bg: "bg-blue-50" },
  booking_confirmed:  { icon: "CheckCheck",    color: "text-emerald-500", bg: "bg-emerald-50" },
  ical_error:         { icon: "AlertTriangle", color: "text-red-500",     bg: "bg-red-50" },
  availability_alert: { icon: "Bell",          color: "text-amber-500",   bg: "bg-amber-50" },
  system:             { icon: "Info",          color: "text-navy/60",     bg: "bg-navy/5" },
  request_update:     { icon: "MessageCircle", color: "text-gold",        bg: "bg-gold/10" },
  checkin_reminder:   { icon: "Key",           color: "text-emerald-500", bg: "bg-emerald-50" },
  checkout_reminder:  { icon: "DoorOpen",      color: "text-amber-500",   bg: "bg-amber-50" },
  new_message:        { icon: "MessageCircle", color: "text-blue-500",    bg: "bg-blue-50" },
};
