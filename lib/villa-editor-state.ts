import type { VillaFormData } from "@/lib/validations/villa";

export type VillaFormAction =
  | { type: "SET_FIELD"; field: string; value: unknown }
  | { type: "SET_ROOMS"; rooms: VillaFormData["rooms_details"] }
  | { type: "SET_SEASONS"; seasons: VillaFormData["seasonal_prices"] }
  | { type: "SET_CONTACTS"; contacts: VillaFormData["emergency_contacts"] }
  | { type: "SET_IMAGES"; urls: string[] }
  | { type: "SET_ARRAY"; field: string; value: string[] }
  | { type: "LOAD_VILLA"; villa: Partial<VillaFormData> };

export function createEmptyForm(): VillaFormData {
  return {
    name: "", location: "", description: "",
    price_per_night: 150, capacity: 2, bedrooms: 1, bathrooms_count: 1, surface_m2: 0,
    image_url: "", image_urls: [],
    equipment_interior: [], equipment_exterior: [],
    house_rules: [], safety_info: [],
    check_in_time: "15:00", check_out_time: "10:00",
    environment: "", nearby_points: [],
    included_services_home: [], included_services_collection: [], a_la_carte_services: [],
    wifi_name: "", wifi_password: "", checkout_instructions: "",
    map_embed_url: "", airbnb_url: "",
    latitude: 0, longitude: 0,
    rooms_details: [], seasonal_prices: [], emergency_contacts: [],
    booking_terms: {}, min_nights: 2,
    welcome_booklet_url: "", cancellation_policy: "", cancellation_template: "", cancellation_notes: "",
    is_published: false, commission_rate: 22, owner_id: "", collection_tier: "", cleaning_fee_cents: 0,
  };
}

export function villaFormReducer(state: VillaFormData, action: VillaFormAction): VillaFormData {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_ARRAY":
      return { ...state, [action.field]: Array.isArray(action.value) ? action.value : [] };
    case "SET_ROOMS":
      return { ...state, rooms_details: action.rooms };
    case "SET_SEASONS":
      return { ...state, seasonal_prices: action.seasons };
    case "SET_CONTACTS":
      return { ...state, emergency_contacts: action.contacts };
    case "SET_IMAGES":
      return { ...state, image_urls: action.urls, image_url: action.urls[0] ?? "" };
    case "LOAD_VILLA":
      const base = createEmptyForm();
      return { ...base, ...action.villa };
    default:
      return state;
  }
}

export function sectionCompleteness(form: VillaFormData): Record<string, "empty" | "partial" | "complete"> {
  const has = (arr: unknown[]) => arr.length > 0;
  const str = (s: string) => s.trim().length > 0;
  return {
    infos: str(form.name) ? "complete" : "empty",
    photos: has(form.image_urls) ? "complete" : "empty",
    equipments: (has(form.equipment_interior) || has(form.equipment_exterior)) ? "complete" : "empty",
    rooms: has(form.rooms_details) ? "complete" : "empty",
    pricing: form.price_per_night > 0 ? "complete" : "empty",
    availability: "empty",
    contacts: has(form.emergency_contacts) ? "complete" : "empty",
    services: (has(form.included_services_home) || has(form.included_services_collection)) ? "complete" : "empty",
    rules: has(form.house_rules) ? "complete" : "empty",
    safety: has(form.safety_info) ? "complete" : "empty",
  };
}
