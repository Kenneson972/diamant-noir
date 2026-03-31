export type BookingStatus = "pending" | "confirmed";
export type BookingSource = "airbnb" | "direct";

export interface Booking {
  id: string;
  villa_id: string | null;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  source: BookingSource;
  guest_name: string | null;
  price: number;
  created_at?: string;
}

export interface Villa {
  id: string;
  name: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  image_url: string | null;
  location: string | null;
  ical_url: string | null;
  access_token: string | null;
  created_at?: string;
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
