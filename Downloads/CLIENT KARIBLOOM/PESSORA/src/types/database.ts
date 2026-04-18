export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          avatar_url: string | null
          role: 'member' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'free' | 'starter' | 'premium' | 'vip'
          status: 'active' | 'expired' | 'cancelled'
          start_date: string
          end_date: string | null
          auto_renew: boolean
          price: number
          stripe_subscription_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['subscriptions']['Row'], 'id' | 'created_at' | 'updated_at'>>
      }
      events: {
        Row: {
          id: string
          title: string
          slug: string
          date: string
          heure: string | null
          location: string | null
          type: 'run_club' | 'popup' | 'atelier' | 'event'
          description: string | null
          image_url: string | null
          places_max: number | null
          active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['events']['Row'], 'id' | 'created_at'>>
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
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['event_registrations']['Row'], 'id' | 'created_at'>
        Update: never
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
      }
    }
  }
}

export type Event = Database['public']['Tables']['events']['Row']
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row']
export type BilanSlot = Database['public']['Tables']['bilan_slots']['Row']
export type BilanBooking = Database['public']['Tables']['bilan_bookings']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
