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

/* ─── Villa ─────────────────────────────────────────── */

export interface Villa {
  id: string;
  owner_id: string | null;
  name: string;
  location: string | null;
  description: string | null;
  price_per_night: number;
  capacity: number;
  image_url: string | null;
  image_urls: string[];
  airbnb_url: string | null;
  ical_url: string | null;
  ota_channels: OTAChannel[] | null;
  is_published: boolean;
  amenities: string[];
  amenities_import_labels: string[] | null;
  rooms_details: RoomDetail[] | null;
  seasonal_prices: SeasonalPrice[] | null;
  cancellation_policy: string | null;
  house_rules: string | null;
  safety_info: string | null;
  bathrooms_count: number | null;
  surface_m2: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  environment: string | null;
  nearby_points_text: string | null;
  equipment_interior_text: string | null;
  equipment_exterior_text: string | null;
  included_services_home_text: string | null;
  included_services_collection_text: string | null;
  a_la_carte_services_text: string | null;
  booking_terms_text: string | null;
  collection_tier: VillaTier | null;
  access_token: string | null;
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

/* ─── Booking ───────────────────────────────────────── */

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
  price: number;
  stripe_session_id: string | null;
  checklist_state: Record<string, boolean> | null;
  created_at: string;
}

export interface BookingPriceInput {
  startDate: Date;
  endDate: Date;
  basePrice?: number;
}

export interface BookingPriceResult {
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

/* ─── Villa Events (analytics) ──────────────────────── */

export interface VillaEvent {
  id: string;
  villa_id: string;
  event_type: EventType;
  created_at: string;
}

/* ─── Contact Requests ──────────────────────────────── */

export interface ContactRequest {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
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

/* ─── Wishlist ──────────────────────────────────────── */

export interface WishlistItem {
  id: string;
  user_id: string;
  villa_id: string;
  created_at: string;
}

/* ─── Availability Alerts ───────────────────────────── */

export interface AvailabilityAlert {
  id: string;
  email: string;
  villa_id: string | null;
  checkin: string | null;
  checkout: string | null;
  is_active: boolean;
  created_at: string;
}

/* ─── Booking Calendar Slots ────────────────────────── */

export interface BookingCalendarSlot {
  id: string;
  villa_id: string;
  date: string;
  is_available: boolean;
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

/* ─── Stripe Events (idempotence) ───────────────────── */

export interface StripeProcessedEvent {
  event_id: string;
  event_type: string;
  processed_at: string;
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
