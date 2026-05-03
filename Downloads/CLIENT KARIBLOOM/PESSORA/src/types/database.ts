/** Valeurs JSON Postgres / Supabase (payload questionnaire, etc.). */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/** Évite la référence circulaire Database → profiles.Row (sinon Insert/Update → never côté client). */
export interface ProfilesTableRow {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  role: 'member' | 'admin' | null
  preferences: Record<string, boolean> | null
  /** Filtres / recherche admin (clés : members_filters_v1, admin_events_filters_v1, …) */
  admin_ui_prefs: Record<string, unknown> | null
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    /** Requis par @supabase/postgrest-js (GenericSchema) — aucune vue métier typée. */
    Views: Record<string, { Row: Record<string, unknown>; Relationships: [] }>
    Tables: {
      profiles: {
        Row: ProfilesTableRow
        Insert: Omit<ProfilesTableRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProfilesTableRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'ora_plus'
          status: 'active' | 'expired' | 'cancelled'
          start_date: string
          end_date: string | null
          auto_renew: boolean
          price: number
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      events: {
        Row: {
          id: string
          title: string
          slug: string
          date: string
          heure: string | null
          location: string | null
          type: 'run_club' | 'popup' | 'atelier' | 'event' | 'partenariat' | 'bilan'
          description: string | null
          image_url: string | null
          gallery: string[]
          places_max: number | null
          meeting_point: string | null
          price: number | null
          is_free: boolean
          registration_open: boolean
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at' | 'gallery'> & { gallery?: string[] }
        Update: Partial<Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      event_registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string | null
          nom: string
          prenom: string
          telephone: string
          nb_personnes: string
          souhait_info: string
          post_registration_details: Json | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_registrations']['Row'], 'id' | 'created_at' | 'post_registration_details'> & {
          id?: string
          post_registration_details?: Json | null
        }
        Update: Partial<Pick<Database['public']['Tables']['event_registrations']['Row'], 'post_registration_details'>>
        Relationships: []
      }
      bilan_slots: {
        Row: {
          id: string
          date: string
          heure: string
          disponible: boolean
        }
        Insert: Omit<Database['public']['Tables']['bilan_slots']['Row'], 'id'>
        Update: Partial<Omit<Database['public']['Tables']['bilan_slots']['Row'], 'id'>>
        Relationships: []
      }
      bilan_bookings: {
        Row: {
          id: string
          slot_id: string | null
          user_id: string | null
          nom: string
          prenom: string
          telephone: string
          email: string | null
          date_rdv: string
          heure_rdv: string
          statut: 'en_attente' | 'confirme' | 'annule'
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['bilan_bookings']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['bilan_bookings']['Row'], 'statut' | 'notes'>>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          category: string
          price: number | null
          price_small: number | null
          price_medium: number | null
          price_large: number | null
          calories: number | null
          protein: number | null
          description: string | null
          ingredients: string[] | null
          benefits: string[] | null
          image_url: string | null
          active: boolean
          slug: string | null
          pitch: string | null
          icon_emoji: string | null
          badges: string[] | null
          carousel_sort: number | null
          carousel_badge: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          total: number
          status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          pickup_time: string | null
          picked_up_at: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['orders']['Row'], 'status'>>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          price_at_time: number
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id'>
        Update: Record<string, never>
        Relationships: []
      }
      favorites: {
        Row: {
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['favorites']['Row'], 'created_at'>
        Update: Record<string, never>
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'info' | 'promo' | 'reminder' | 'event'
          message: string
          read: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['notifications']['Row'], 'read'>>
        Relationships: []
      }
      site_announcements: {
        Row: {
          id: string
          type: 'featured' | 'promo' | 'event' | 'alert'
          title: string
          subtitle: string | null
          message: string | null
          image_url: string | null
          cta_label: string | null
          cta_url: string | null
          price: number | null
          expires_at: string | null
          active: boolean
          dismiss_mode: 'once_daily' | 'once_session'
          priority: number
          created_at: string
          updated_at: string
        }
        Insert: {
          type?: 'featured' | 'promo' | 'event' | 'alert'
          title: string
          subtitle?: string | null
          message?: string | null
          image_url?: string | null
          cta_label?: string | null
          cta_url?: string | null
          price?: number | null
          expires_at?: string | null
          active?: boolean
          dismiss_mode?: 'once_daily' | 'once_session'
          priority?: number
        }
        Update: Partial<{
          type: 'featured' | 'promo' | 'event' | 'alert'
          title: string
          subtitle: string | null
          message: string | null
          image_url: string | null
          cta_label: string | null
          cta_url: string | null
          price: number | null
          expires_at: string | null
          active: boolean
          dismiss_mode: 'once_daily' | 'once_session'
          priority: number
          updated_at: string
        }>
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          consent: boolean
          source: string
          created_at: string
        }
        Insert: {
          email: string
          consent?: boolean
          source?: string
        }
        Update: Record<string, never>
        Relationships: []
      }
      gamme_products: {
        Row: {
          id: string
          gamme: 'sport' | 'skin' | 'wellness'
          subcategory: string | null
          name: string
          description: string | null
          price: number
          price_alt: number | null
          image_url: string | null
          sort_order: number
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['gamme_products']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['gamme_products']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      bar_settings: {
        Row: {
          id: number
          address: BarAddress
          hours: BarHours
          contact: BarContact
          subscription_info: BarSubscriptionInfo
          updated_at: string
        }
        Insert: {
          id?: number
          address?: BarAddress
          hours?: BarHours
          contact?: BarContact
          subscription_info?: BarSubscriptionInfo
        }
        Update: Partial<{
          address: BarAddress
          hours: BarHours
          contact: BarContact
          subscription_info: BarSubscriptionInfo
        }>
        Relationships: []
      }
    }
    Functions: {
      fn_save_post_registration_survey: {
        Args: {
          p_registration_id: string
          p_telephone: string
          /** Objet JSON sérialisable (questionnaire). */
          p_payload: Record<string, string>
        }
        Returns: Json
      }
    }
  }
}

export interface BarAddress {
  street: string
  city: string
  postal_code: string
  country: string
  full: string
  maps_url: string
}

export type BarHours = Array<{ label: string; value: string }>

export interface BarContact {
  email: string
  phone: string
  instagram: string
  instagram_url: string
}

export interface BarSubscriptionPlan {
  name: string
  tagline: string
  price: string
  period: string
  highlight: string
  benefits: string[]
  cta_url: string
}

export interface BarSubscriptionInfo {
  /** Détail Óra+ (abonnement principal). Clé stable pour le system prompt PessoBot. */
  ora_plus?: BarSubscriptionPlan
}

export type BarSettings = Database['public']['Tables']['bar_settings']['Row']

export type Event = Database['public']['Tables']['events']['Row']
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row']
export type BilanSlot = Database['public']['Tables']['bilan_slots']['Row']
export type BilanBooking = Database['public']['Tables']['bilan_bookings']['Row']
export type Profile = ProfilesTableRow
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type SiteAnnouncement = Database['public']['Tables']['site_announcements']['Row']
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row']
export type GammeProduct = Database['public']['Tables']['gamme_products']['Row']
