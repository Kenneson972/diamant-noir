export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      admin_chat_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: string
          intent: string | null
          message: string | null
          response: string | null
          success: boolean | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string
          intent?: string | null
          message?: string | null
          response?: string | null
          success?: boolean | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string
          intent?: string | null
          message?: string | null
          response?: string | null
          success?: boolean | null
        }
        Relationships: []
      }
      ai_action_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          owner_id: string | null
          payload: Json
          request_id: string | null
          role: string
        }
        Insert: {
          action_type?: string
          created_at?: string
          id?: string
          owner_id?: string | null
          payload?: Json
          request_id?: string | null
          role?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          owner_id?: string | null
          payload?: Json
          request_id?: string | null
          role?: string
        }
        Relationships: []
      }
      booking_shares: {
        Row: {
          booking_id: string
          created_at: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_shares_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          checklist: Json | null
          checklist_state: Json | null
          cleaning_fee: number | null
          client_user_id: string | null
          created_at: string
          end_date: string
          external_id: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          guests: number
          id: string
          notes: string | null
          payment_status: string | null
          price: number
          service_fee: number | null
          source: string
          start_date: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_price_cents: number | null
          villa_id: string | null
        }
        Insert: {
          checklist?: Json | null
          checklist_state?: Json | null
          cleaning_fee?: number | null
          client_user_id?: string | null
          created_at?: string
          end_date: string
          external_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests?: number
          id?: string
          notes?: string | null
          payment_status?: string | null
          price?: number
          service_fee?: number | null
          source: string
          start_date: string
          status: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_price_cents?: number | null
          villa_id?: string | null
        }
        Update: {
          checklist?: Json | null
          checklist_state?: Json | null
          cleaning_fee?: number | null
          client_user_id?: string | null
          created_at?: string
          end_date?: string
          external_id?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          guests?: number
          id?: string
          notes?: string | null
          payment_status?: string | null
          price?: number
          service_fee?: number | null
          source?: string
          start_date?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_price_cents?: number | null
          villa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_villa"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_logs: {
        Row: {
          created_at: string | null
          id: string
          intent: string | null
          message: string | null
          response: string | null
          role: string | null
          session_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          intent?: string | null
          message?: string | null
          response?: string | null
          role?: string | null
          session_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          intent?: string | null
          message?: string | null
          response?: string | null
          role?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      conciergerie_settings: {
        Row: {
          contact_email: string
          contact_phone: string
          emergency_phone: string
          id: number
          opening_hours: Json | null
          services: Json | null
          updated_at: string
        }
        Insert: {
          contact_email?: string
          contact_phone?: string
          emergency_phone?: string
          id?: number
          opening_hours?: Json | null
          services?: Json | null
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_phone?: string
          emergency_phone?: string
          id?: number
          opening_hours?: Json | null
          services?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          booking_id: string | null
          changed_by: string
          created_at: string | null
          from_status: string | null
          id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          booking_id?: string | null
          changed_by?: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status: string
        }
        Update: {
          booking_id?: string | null
          changed_by?: string
          created_at?: string | null
          from_status?: string | null
          id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      ota_sync_logs: {
        Row: {
          deleted: number | null
          duration_ms: number | null
          error: string | null
          id: string
          inserted: number | null
          source: string
          synced_at: string | null
          villa_id: string | null
        }
        Insert: {
          deleted?: number | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          inserted?: number | null
          source: string
          synced_at?: string | null
          villa_id?: string | null
        }
        Update: {
          deleted?: number | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          inserted?: number | null
          source?: string
          synced_at?: string | null
          villa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ota_sync_logs_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_alerts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          metadata: Json
          owner_id: string
          read_at: string | null
          severity: string
          title: string
          villa_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          owner_id: string
          read_at?: string | null
          severity?: string
          title: string
          villa_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          owner_id?: string
          read_at?: string | null
          severity?: string
          title?: string
          villa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "owner_alerts_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          estimated_arrival: string | null
          full_name: string | null
          id: string
          id_document_url: string | null
          needs_baby_bed: boolean | null
          needs_high_chair: boolean | null
          phone: string | null
          role: string
          special_occasion: string | null
          special_occasion_date: string | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarding_completed: boolean | null
          suspended: boolean
        }
        Insert: {
          allergies?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          estimated_arrival?: string | null
          full_name?: string | null
          id: string
          id_document_url?: string | null
          needs_baby_bed?: boolean | null
          needs_high_chair?: boolean | null
          phone?: string | null
          role?: string
          special_occasion?: string | null
          special_occasion_date?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_completed?: boolean | null
          suspended?: boolean
        }
        Update: {
          allergies?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          estimated_arrival?: string | null
          full_name?: string | null
          id?: string
          id_document_url?: string | null
          needs_baby_bed?: boolean | null
          needs_high_chair?: boolean | null
          phone?: string | null
          role?: string
          special_occasion?: string | null
          special_occasion_date?: string | null
          stripe_connect_account_id?: string | null
          stripe_connect_onboarding_completed?: boolean | null
          suspended?: boolean
        }
        Relationships: []
      }
      referrals: {
        Row: {
          code: string
          created_at: string
          friend_email: string
          friend_name: string | null
          id: string
          referrer_id: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          friend_email: string
          friend_name?: string | null
          id?: string
          referrer_id: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          friend_email?: string
          friend_name?: string | null
          id?: string
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      requests: {
        Row: {
          admin_response: string | null
          assignee_id: string | null
          booking_id: string | null
          created_at: string
          guest_id: string | null
          id: string
          message: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          assignee_id?: string | null
          booking_id?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          message?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          assignee_id?: string | null
          booking_id?: string | null
          created_at?: string
          guest_id?: string | null
          id?: string
          message?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requests_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "admin_owner_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string | null
          guest_id: string | null
          guest_name: string
          id: string
          photos: Json | null
          rating: number
          status: string
          updated_at: string | null
          villa_id: string | null
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          guest_id?: string | null
          guest_name: string
          id?: string
          photos?: Json | null
          rating: number
          status?: string
          updated_at?: string | null
          villa_id?: string | null
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string | null
          guest_id?: string | null
          guest_name?: string
          id?: string
          photos?: Json | null
          rating?: number
          status?: string
          updated_at?: string | null
          villa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_rates: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          label: string
          price_per_night: number
          start_date: string
          villa_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          label: string
          price_per_night: number
          start_date: string
          villa_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          label?: string
          price_per_night?: number
          start_date?: string
          villa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasonal_rates_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          color: string
          id: number
          months: number[]
          name: string
          updated_at: string | null
        }
        Insert: {
          color: string
          id?: number
          months?: number[]
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          id?: number
          months?: number[]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_disputes: {
        Row: {
          amount_cents: number | null
          booking_id: string | null
          charge_id: string | null
          created_at: string | null
          dispute_id: string
          evidence_due_by: string | null
          id: string
          reason: string | null
          resolved_at: string | null
          status: string | null
        }
        Insert: {
          amount_cents?: number | null
          booking_id?: string | null
          charge_id?: string | null
          created_at?: string | null
          dispute_id: string
          evidence_due_by?: string | null
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Update: {
          amount_cents?: number | null
          booking_id?: string | null
          charge_id?: string | null
          created_at?: string | null
          dispute_id?: string
          evidence_due_by?: string | null
          id?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events_processed: {
        Row: {
          event_id: string
          event_type: string
          processed_at: string | null
        }
        Insert: {
          event_id: string
          event_type: string
          processed_at?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          created_at: string | null
          guest_email: string | null
          id: string
          message: string | null
          session_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          guest_email?: string | null
          id?: string
          message?: string | null
          session_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          guest_email?: string | null
          id?: string
          message?: string | null
          session_id?: string | null
          status?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          content: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          status: string | null
          title: string | null
          type: string | null
          villa_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          content: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          villa_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          content?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          title?: string | null
          type?: string | null
          villa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_ical_feeds: {
        Row: {
          created_at: string
          ical_url: string
          id: string
          is_active: boolean
          label: string
          last_error: string | null
          last_synced_at: string | null
          platform: string
          sync_count: number
          updated_at: string
          villa_id: string
        }
        Insert: {
          created_at?: string
          ical_url: string
          id?: string
          is_active?: boolean
          label?: string
          last_error?: string | null
          last_synced_at?: string | null
          platform: string
          sync_count?: number
          updated_at?: string
          villa_id: string
        }
        Update: {
          created_at?: string
          ical_url?: string
          id?: string
          is_active?: boolean
          label?: string
          last_error?: string | null
          last_synced_at?: string | null
          platform?: string
          sync_count?: number
          updated_at?: string
          villa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "villa_ical_feeds_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
      villa_submissions: {
        Row: {
          adresse_postale: string | null
          ai_recommendation: string | null
          ai_score: number | null
          ai_tier: string | null
          airbnb_url: string | null
          chambres: string | null
          created_at: string | null
          delai_souhaite: string | null
          email: string
          etages: string | null
          gardien_existant: string | null
          has_photos: boolean | null
          id: string
          internal_notes: string | null
          kanban_order: number | null
          message: string | null
          name: string
          no_photos: boolean | null
          parking_places: string | null
          parking_securise: boolean | null
          phone: string | null
          platforms: Json | null
          salles_de_bains: string | null
          status: string | null
          surface_terrain: string | null
          updated_at: string | null
          villa_description: string | null
          villa_location: string | null
          villa_name: string | null
          visit_date: string | null
        }
        Insert: {
          adresse_postale?: string | null
          ai_recommendation?: string | null
          ai_score?: number | null
          ai_tier?: string | null
          airbnb_url?: string | null
          chambres?: string | null
          created_at?: string | null
          delai_souhaite?: string | null
          email: string
          etages?: string | null
          gardien_existant?: string | null
          has_photos?: boolean | null
          id?: string
          internal_notes?: string | null
          kanban_order?: number | null
          message?: string | null
          name: string
          no_photos?: boolean | null
          parking_places?: string | null
          parking_securise?: boolean | null
          phone?: string | null
          platforms?: Json | null
          salles_de_bains?: string | null
          status?: string | null
          surface_terrain?: string | null
          updated_at?: string | null
          villa_description?: string | null
          villa_location?: string | null
          villa_name?: string | null
          visit_date?: string | null
        }
        Update: {
          adresse_postale?: string | null
          ai_recommendation?: string | null
          ai_score?: number | null
          ai_tier?: string | null
          airbnb_url?: string | null
          chambres?: string | null
          created_at?: string | null
          delai_souhaite?: string | null
          email?: string
          etages?: string | null
          gardien_existant?: string | null
          has_photos?: boolean | null
          id?: string
          internal_notes?: string | null
          kanban_order?: number | null
          message?: string | null
          name?: string
          no_photos?: boolean | null
          parking_places?: string | null
          parking_securise?: boolean | null
          phone?: string | null
          platforms?: Json | null
          salles_de_bains?: string | null
          status?: string | null
          surface_terrain?: string | null
          updated_at?: string | null
          villa_description?: string | null
          villa_location?: string | null
          villa_name?: string | null
          visit_date?: string | null
        }
        Relationships: []
      }
      villas: {
        Row: {
          a_la_carte_services: string[] | null
          access_token: string | null
          airbnb_url: string | null
          amenities: Json | null
          amenities_import_labels: string[] | null
          bathrooms_count: number | null
          booking_terms: Json | null
          cancellation_policy: string | null
          capacity: number
          check_in_time: string | null
          check_out_time: string | null
          checkout_instructions: string | null
          cleaning_fee_cents: number | null
          collection_tier: string | null
          commission_rate: number | null
          created_at: string
          description: string | null
          emergency_contacts: Json | null
          environment: string | null
          equipment_exterior: string[] | null
          equipment_interior: string[] | null
          house_manual: Json | null
          house_rules: string | null
          ical_url: string | null
          id: string
          image_url: string | null
          image_urls: Json | null
          included_services_collection: string[] | null
          included_services_home: string[] | null
          is_published: boolean | null
          latitude: number | null
          local_recommendations: Json | null
          location: string | null
          longitude: number | null
          map_embed_url: string | null
          min_nights: number
          name: string
          nearby_points: string[] | null
          ota_channels: Json | null
          owner_id: string | null
          price_per_night: number
          rooms_details: Json | null
          safety_info: string | null
          seasonal_prices: Json | null
          slug: string | null
          surface_m2: number | null
          wifi_name: string | null
          wifi_password: string | null
        }
        Insert: {
          a_la_carte_services?: string[] | null
          access_token?: string | null
          airbnb_url?: string | null
          amenities?: Json | null
          amenities_import_labels?: string[] | null
          bathrooms_count?: number | null
          booking_terms?: Json | null
          cancellation_policy?: string | null
          capacity?: number
          check_in_time?: string | null
          check_out_time?: string | null
          checkout_instructions?: string | null
          cleaning_fee_cents?: number | null
          collection_tier?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          emergency_contacts?: Json | null
          environment?: string | null
          equipment_exterior?: string[] | null
          equipment_interior?: string[] | null
          house_manual?: Json | null
          house_rules?: string | null
          ical_url?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          included_services_collection?: string[] | null
          included_services_home?: string[] | null
          is_published?: boolean | null
          latitude?: number | null
          local_recommendations?: Json | null
          location?: string | null
          longitude?: number | null
          map_embed_url?: string | null
          min_nights?: number
          name: string
          nearby_points?: string[] | null
          ota_channels?: Json | null
          owner_id?: string | null
          price_per_night?: number
          rooms_details?: Json | null
          safety_info?: string | null
          seasonal_prices?: Json | null
          slug?: string | null
          surface_m2?: number | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Update: {
          a_la_carte_services?: string[] | null
          access_token?: string | null
          airbnb_url?: string | null
          amenities?: Json | null
          amenities_import_labels?: string[] | null
          bathrooms_count?: number | null
          booking_terms?: Json | null
          cancellation_policy?: string | null
          capacity?: number
          check_in_time?: string | null
          check_out_time?: string | null
          checkout_instructions?: string | null
          cleaning_fee_cents?: number | null
          collection_tier?: string | null
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          emergency_contacts?: Json | null
          environment?: string | null
          equipment_exterior?: string[] | null
          equipment_interior?: string[] | null
          house_manual?: Json | null
          house_rules?: string | null
          ical_url?: string | null
          id?: string
          image_url?: string | null
          image_urls?: Json | null
          included_services_collection?: string[] | null
          included_services_home?: string[] | null
          is_published?: boolean | null
          latitude?: number | null
          local_recommendations?: Json | null
          location?: string | null
          longitude?: number | null
          map_embed_url?: string | null
          min_nights?: number
          name?: string
          nearby_points?: string[] | null
          ota_channels?: Json | null
          owner_id?: string | null
          price_per_night?: number
          rooms_details?: Json | null
          safety_info?: string | null
          seasonal_prices?: Json | null
          slug?: string | null
          surface_m2?: number | null
          wifi_name?: string | null
          wifi_password?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_owner_summary: {
        Row: {
          avatar_url: string | null
          avg_commission: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          published_count: number | null
          role: string | null
          stripe_connect_account_id: string | null
          stripe_connect_onboarding_completed: boolean | null
          suspended: boolean | null
          villa_count: number | null
        }
        Relationships: []
      }
      booking_calendar_slots: {
        Row: {
          end_date: string | null
          start_date: string | null
          villa_id: string | null
        }
        Insert: {
          end_date?: string | null
          start_date?: string | null
          villa_id?: string | null
        }
        Update: {
          end_date?: string | null
          start_date?: string | null
          villa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_villa_id_fkey"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bookings_villa"
            columns: ["villa_id"]
            isOneToOne: false
            referencedRelation: "villas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      activate_villa_feeds: {
        Args: { p_platforms: Json; p_villa_id: string }
        Returns: undefined
      }
      is_staff_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
