/* ─── Types Supabase générés manuellement depuis le schéma réel (2026-05-07) ─── */
/* Schéma vérifié via script d'audit — manque project_id pour auto-génération */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      villas: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          location: string | null;
          description: string | null;
          price_per_night: number;
          capacity: number;
          image_url: string | null;
          image_urls: Json;
          airbnb_url: string | null;
          ical_url: string | null;
          ota_channels: Json | null;
          access_token: string | null;
          is_published: boolean;
          amenities: Json;
          amenities_import_labels: Json | null;
          rooms_details: Json | null;
          seasonal_prices: Json | null;
          commission_rate: number;
          wifi_name: string | null;
          wifi_password: string | null;
          emergency_contacts: Json | null;
          local_recommendations: Json | null;
          checkout_instructions: string | null;
          cancellation_policy: string | null;
          house_rules: string | null;
          safety_info: string | null;
          bathrooms_count: number | null;
          surface_m2: number | null;
          check_in_time: string | null;
          check_out_time: string | null;
          environment: string | null;
          nearby_points: Json | null;
          equipment_interior: Json | null;
          equipment_exterior: Json | null;
          included_services_home: Json | null;
          included_services_collection: Json | null;
          a_la_carte_services: Json | null;
          booking_terms: Json | null;
          collection_tier: string | null;
          latitude: number | null;
          longitude: number | null;
          map_embed_url: string | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      bookings: {
        Row: {
          id: string;
          villa_id: string | null;
          start_date: string;
          end_date: string;
          status: string;
          payment_status: string;
          source: string;
          guest_name: string | null;
          guest_email: string | null;
          price: number;
          total_price_cents: number | null;
          stripe_session_id: string | null;
          check_in: string | null;
          check_out: string | null;
          checklist_state: Json | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      tasks: {
        Row: {
          id: string;
          villa_id: string | null;
          title: string;
          description: string | null;
          status: string;
          assigned_to: string | null;
          due_date: string | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          type: string;
          title: string;
          body: string;
          metadata: Json | null;
          action_url: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      villa_submissions: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          villa_name: string | null;
          villa_location: string | null;
          villa_description: string | null;
          airbnb_url: string | null;
          no_photos: boolean;
          message: string | null;
          status: string;
          created_at: string;
          updated_at: string | null;
          photo_urls: Json | null;
          platforms: Json | null;
          surface_terrain: string | null;
          chambres: string | null;
          salles_de_bains: string | null;
          etages: string | null;
          parking_places: string | null;
          parking_securise: boolean | null;
          gardien_existant: string | null;
          delai_souhaite: string | null;
          adresse_postale: string | null;
          kanban_order: number | null;
          has_photos: boolean | null;
          visit_date: string | null;
          internal_notes: string | null;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      chat_messages: {
        Row: {
          id: string;
          booking_id: string | null;
          villa_id: string | null;
          sender: string;
          message: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      requests: {
        Row: {
          id: string;
          booking_id: string | null;
          guest_id: string | null;
          type: string;
          status: string;
          message: string | null;
          admin_response: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          guest_id: string;
          villa_id: string;
          rating: number;
          comment: string | null;
          photos: Json | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      referrals: {
        Row: {
          id: string;
          referrer_id: string;
          friend_email: string;
          friend_name: string | null;
          code: string;
          status: string;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          villa_id: string;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          role: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      villa_ical_feeds: {
        Row: {
          id: string;
          villa_id: string | null;
          platform: string | null;
          ical_url: string | null;
          last_synced_at: string | null;
          last_error: string | null;
          is_active: boolean | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      ota_sync_logs: {
        Row: {
          id: string;
          villa_id: string;
          source: string;
          total_inserted: number;
          total_deleted: number;
          error: string | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      admin_chat_logs: {
        Row: {
          id: string;
          message: string;
          intent: string | null;
          action: string | null;
          response: string | null;
          success: boolean | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      ai_action_logs: {
        Row: {
          id: string;
          action: string;
          villa_id: string | null;
          prompt: string | null;
          response: string | null;
          success: boolean;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      owner_alerts: {
        Row: {
          id: string;
          owner_id: string;
          villa_id: string | null;
          severity: string;
          title: string;
          message: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      support_tickets: {
        Row: {
          id: string;
          booking_id: string | null;
          guest_email: string;
          villa_id: string | null;
          issue_type: string | null;
          description: string;
          status: string;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      order_status_history: {
        Row: {
          id: string;
          booking_id: string;
          from_status: string | null;
          to_status: string;
          changed_by: string;
          reason: string | null;
          created_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
      stripe_events_processed: {
        Row: {
          event_id: string;
          event_type: string;
          processed_at: string;
        };
        Insert: Record<string, Json>;
        Update: Record<string, Json>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
