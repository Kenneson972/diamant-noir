/* ─── Enums / Unions ─────────────────────────────────── */

export type BookingStatus = "pending" | "confirmed" | "paid" | "cancelled" | "refunded";
export type BookingSource = "airbnb" | "direct";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type SubmissionStatus = "pending" | "accepted" | "rejected" | "info_requested";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type AlertSeverity = "info" | "warning" | "critical";
export type OTASource = "airbnb" | "expedia" | "trivago" | "vrbo" | "booking" | "direct";
export type VillaTier = "signature" | "prestige" | "collection";
export type IssueType = "technical" | "cleaning" | "appliance" | "other";
export type TicketStatus = "open" | "in_progress" | "resolved";
export type EventType = "view" | "click" | "booking";

/* ─── Villa (schéma réel Supabase) ──────────────────── */

export interface Villa {
  id: string;
  owner_id: string | null;
  name: string;
  slug?: string | null;
  description: string | null;
  price_per_night: number;
  capacity: number;
  image_url: string | null;
  image_urls: string[];
  location: string | null;
  airbnb_url: string | null;
  ical_url: string | null;
  access_token: string | null;
  ota_channels: OTAChannel[] | null;
  is_published: boolean;
  amenities: string[];
  amenities_import_labels: string[] | null;
  rooms_details: RoomDetail[] | null;
  seasonal_prices: SeasonalPrice[] | null;
  commission_rate: number;
  wifi_name: string | null;
  wifi_password: string | null;
  emergency_contacts: EmergencyContact[] | null;
  local_recommendations: LocalRecommendation[] | null;
  checkout_instructions: string | null;
  cancellation_policy: string | null;
  house_rules: string | null;
  safety_info: string | null;
  bathrooms_count: number | null;
  surface_m2: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  environment: string | null;
  nearby_points: string[] | null;
  equipment_interior: string[] | null;
  equipment_exterior: string[] | null;
  included_services_home: string[] | null;
  included_services_collection: string[] | null;
  a_la_carte_services: string[] | null;
  booking_terms: string[] | null;
  collection_tier: VillaTier | null;
  latitude: number | null;
  longitude: number | null;
  map_embed_url: string | null;
  created_at: string;
}

export interface RoomDetail {
  title: string;
  description: string;
}

export interface SeasonalPrice {
  name: string;
  start_date: string;
  end_date: string;
  price: string;
}

export interface OTAChannel {
  source: OTASource;
  ical_url: string;
  label?: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface LocalRecommendation {
  name: string;
  description: string;
}

/* ─── Booking (schéma réel Supabase) ────────────────── */

export interface Booking {
  id: string;
  villa_id: string | null;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  source: BookingSource;
  guest_name: string | null;
  guest_email: string | null;
  /** Prix en euros (legacy, remplacé par total_price_cents) */
  price: number;
  /** Prix en centimes (source de vérité) */
  total_price_cents: number | null;
  stripe_session_id: string | null;
  check_in?: string | null;
  check_out?: string | null;
  checklist_state: Record<string, boolean> | null;
  created_at: string;
}

export interface BookingPriceInput {
  startDate: Date;
  endDate: Date;
  basePrice?: number;
}

export interface BookingPriceResult {
  /** Prix total en euros */
  total: number;
  nights: number;
  breakdown: string;
}

/* ─── Tasks (maintenance) ───────────────────────────── */

export interface Task {
  id: string;
  villa_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
}

/* ─── Notifications ─────────────────────────────────── */

export interface Notification {
  id: string;
  user_id: string | null;
  title: string;
  body: string | null;
  type: string | null;
  is_read: boolean;
  created_at: string;
}

/* ─── Villa Submissions ─────────────────────────────── */

export interface VillaSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  villa_name: string | null;
  villa_location: string | null;
  villa_description: string | null;
  airbnb_url: string | null;
  no_photos: boolean;
  has_photos: boolean;
  photo_urls: string[] | null;
  platforms: VillaSubmissionPlatform[] | null;
  message: string | null;
  status: SubmissionStatus;
  created_at: string;
}

export interface VillaSubmissionPlatform {
  platform: string;
  ical_url: string;
  label?: string;
}

/* ─── Chat Messages ─────────────────────────────────── */

export interface ChatMessage {
  id: string;
  booking_id: string | null;
  villa_id: string | null;
  sender: "user" | "assistant" | "system";
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/* ─── OTA Sync ──────────────────────────────────────── */

export interface OTASyncLog {
  id: string;
  villa_id: string;
  source: OTASource;
  total_inserted: number;
  total_deleted: number;
  error: string | null;
  created_at: string;
}

export interface VillaIcalFeed {
  id: string;
  villa_id: string | null;
  platform: string | null;
  ical_url: string | null;
  last_synced_at: string | null;
  last_error: string | null;
  is_active: boolean | null;
  created_at: string;
}

/* ─── Admin Chat Logs ───────────────────────────────── */

export interface AdminChatLog {
  id: string;
  message: string;
  intent: string | null;
  action: string | null;
  response: string | null;
  success: boolean | null;
  created_at: string;
}

/* ─── AI Action Logs ────────────────────────────────── */

export interface AIActionLog {
  id: string;
  action: string;
  villa_id: string | null;
  prompt: string | null;
  response: string | null;
  success: boolean;
  created_at: string;
}

/* ─── Owner Alerts ──────────────────────────────────── */

export interface OwnerAlert {
  id: string;
  owner_id: string;
  villa_id: string | null;
  severity: AlertSeverity;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

/* ─── Order Status History ──────────────────────────── */

export interface OrderStatusHistory {
  id: string;
  booking_id: string;
  from_status: BookingStatus | null;
  to_status: BookingStatus;
  changed_by: string;
  reason: string | null;
  created_at: string;
}

/* ─── Support Tickets ───────────────────────────────── */

export interface SupportTicket {
  id: string;
  booking_id: string | null;
  guest_email: string;
  villa_id: string | null;
  issue_type: IssueType | null;
  description: string;
  status: TicketStatus;
  created_at: string;
  resolved_at: string | null;
}
