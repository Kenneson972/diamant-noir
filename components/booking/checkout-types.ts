export type CheckoutVilla = {
  id: string;
  name: string;
  location: string | null;
  image_url: string | null;
  image_urls: string[] | null;
  price_per_night: number;
  cleaning_fee_cents: number | null;
  min_nights: number | null;
  checkout_instructions: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
};
