export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          title: string
          description: string
          start_date: string
          end_date: string
          type: 'conference' | 'exhibition' | 'hybrid'
          status: 'draft' | 'published' | 'live' | 'ended'
          banner_url: string | null
          logo_url: string | null
          max_attendees: number
          current_attendees: number
          organizer_id: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          start_date: string
          end_date: string
          type: 'conference' | 'exhibition' | 'hybrid'
          status?: 'draft' | 'published' | 'live' | 'ended'
          banner_url?: string | null
          logo_url?: string | null
          max_attendees?: number
          current_attendees?: number
          organizer_id: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          start_date?: string
          end_date?: string
          type?: 'conference' | 'exhibition' | 'hybrid'
          status?: 'draft' | 'published' | 'live' | 'ended'
          banner_url?: string | null
          logo_url?: string | null
          max_attendees?: number
          current_attendees?: number
          organizer_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      conferences: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string
          speaker_ids: string[]
          type: 'keynote' | 'panel' | 'workshop' | 'presentation'
          status: 'scheduled' | 'live' | 'ended' | 'cancelled'
          start_time: string
          end_time: string
          stream_url: string | null
          recording_url: string | null
          materials_url: string[]
          max_attendees: number
          current_attendees: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          title: string
          description: string
          speaker_ids?: string[]
          type: 'keynote' | 'panel' | 'workshop' | 'presentation'
          status?: 'scheduled' | 'live' | 'ended' | 'cancelled'
          start_time: string
          end_time: string
          stream_url?: string | null
          recording_url?: string | null
          materials_url?: string[]
          max_attendees?: number
          current_attendees?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          title?: string
          description?: string
          speaker_ids?: string[]
          type?: 'keynote' | 'panel' | 'workshop' | 'presentation'
          status?: 'scheduled' | 'live' | 'ended' | 'cancelled'
          start_time?: string
          end_time?: string
          stream_url?: string | null
          recording_url?: string | null
          materials_url?: string[]
          max_attendees?: number
          current_attendees?: number
          created_at?: string
          updated_at?: string
        }
      }
      stands: {
        Row: {
          id: string
          event_id: string
          company_name: string
          description: string
          type: 'basic' | 'premium' | 'enterprise'
          banner_url: string | null
          logo_url: string | null
          video_url: string | null
          brochure_urls: string[]
          website_url: string | null
          contact_email: string
          staff_ids: string[]
          custom_theme: Json | null
          analytics: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          company_name: string
          description: string
          type?: 'basic' | 'premium' | 'enterprise'
          banner_url?: string | null
          logo_url?: string | null
          video_url?: string | null
          brochure_urls?: string[]
          website_url?: string | null
          contact_email: string
          staff_ids?: string[]
          custom_theme?: Json | null
          analytics?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          company_name?: string
          description?: string
          type?: 'basic' | 'premium' | 'enterprise'
          banner_url?: string | null
          logo_url?: string | null
          video_url?: string | null
          brochure_urls?: string[]
          website_url?: string | null
          contact_email?: string
          staff_ids?: string[]
          custom_theme?: Json | null
          analytics?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      networking_rooms: {
        Row: {
          id: string
          event_id: string
          name: string
          description: string
          max_participants: number
          current_participants: number
          topic_tags: string[]
          is_private: boolean
          scheduled_start: string | null
          scheduled_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          description: string
          max_participants?: number
          current_participants?: number
          topic_tags?: string[]
          is_private?: boolean
          scheduled_start?: string | null
          scheduled_end?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          description?: string
          max_participants?: number
          current_participants?: number
          topic_tags?: string[]
          is_private?: boolean
          scheduled_start?: string | null
          scheduled_end?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          full_name: string
          company: string | null
          position: string | null
          bio: string | null
          avatar_url: string | null
          role: 'attendee' | 'exhibitor' | 'speaker' | 'organizer' | 'admin'
          interests: string[]
          social_links: Json | null
          profile_id: string | null
          settings: Json | null
          created_at: string
          updated_at: string
          email: string
        }
        Insert: {
          id: string
          full_name: string
          company?: string | null
          position?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'attendee' | 'exhibitor' | 'speaker' | 'organizer' | 'admin'
          interests?: string[]
          social_links?: Json | null
          profile_id?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
          email: string
        }
        Update: {
          id?: string
          full_name?: string
          company?: string | null
          position?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'attendee' | 'exhibitor' | 'speaker' | 'organizer' | 'admin'
          interests?: string[]
          social_links?: Json | null
          profile_id?: string | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
          email?: string
        }
      }
      exhibitors: {
        Row: {
          id: string
          user_id: string | null
          company_name: string
          description: string | null
          logo_url: string | null
          website_url: string | null
          contact_email: string
          contact_phone: string | null
          social_links: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_name: string
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          contact_email: string
          contact_phone?: string | null
          social_links?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          company_name?: string
          description?: string | null
          logo_url?: string | null
          website_url?: string | null
          contact_email?: string
          contact_phone?: string | null
          social_links?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      event_exhibitors: {
        Row: {
          id: string
          event_id: string
          exhibitor_id: string
          booth_number: string | null
          booth_size: string | null
          booth_type: string
          booth_location: string | null
          custom_theme: Json | null
          is_sponsor: boolean
          sponsor_level: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          exhibitor_id: string
          booth_number?: string | null
          booth_size?: string | null
          booth_type?: string
          booth_location?: string | null
          custom_theme?: Json | null
          is_sponsor?: boolean
          sponsor_level?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          exhibitor_id?: string
          booth_number?: string | null
          booth_size?: string | null
          booth_type?: string
          booth_location?: string | null
          custom_theme?: Json | null
          is_sponsor?: boolean
          sponsor_level?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      exhibitor_materials: {
        Row: {
          id: string
          exhibitor_id: string
          event_id: string
          title: string
          description: string | null
          type: string
          url: string
          is_featured: boolean
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exhibitor_id: string
          event_id: string
          title: string
          description?: string | null
          type: string
          url: string
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exhibitor_id?: string
          event_id?: string
          title?: string
          description?: string | null
          type?: string
          url?: string
          is_featured?: boolean
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          type: 'presentation' | 'workshop' | 'networking' | 'exhibition'
          capacity: number
          description: string | null
          meeting_url: string | null
          features: Json | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: 'presentation' | 'workshop' | 'networking' | 'exhibition'
          capacity?: number
          description?: string | null
          meeting_url?: string | null
          features?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: 'presentation' | 'workshop' | 'networking' | 'exhibition'
          capacity?: number
          description?: string | null
          meeting_url?: string | null
          features?: Json | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      sessions: {
        Row: {
          id: string
          room_id: string
          title: string
          description: string
          type: 'keynote' | 'talk' | 'workshop' | 'panel' | 'qa'
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | null
          start_time: string
          end_time: string
          max_attendees: number
          current_attendees: number | null
          is_private: boolean | null
          settings: Json | null
          created_at: string | null
          updated_at: string | null
          event_id: string | null
          meeting_url: string | null
        }
        Insert: {
          id?: string
          room_id: string
          title: string
          description: string
          type: 'keynote' | 'talk' | 'workshop' | 'panel' | 'qa'
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | null
          start_time: string
          end_time: string
          max_attendees?: number
          current_attendees?: number | null
          is_private?: boolean | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
          event_id?: string | null
          meeting_url?: string | null
        }
        Update: {
          id?: string
          room_id?: string
          title?: string
          description?: string
          type?: 'keynote' | 'talk' | 'workshop' | 'panel' | 'qa'
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | null
          start_time?: string
          end_time?: string
          max_attendees?: number
          current_attendees?: number | null
          is_private?: boolean | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
          event_id?: string | null
          meeting_url?: string | null
        }
      }
      speakers: {
        Row: {
          id: string
          user_id: string | null
          full_name: string
          bio: string | null
          company: string | null
          position: string | null
          photo_url: string | null
          social_links: Json | null
          topics: string[] | null
          created_at: string | null
          updated_at: string | null
          access_link: string | null
          email: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          full_name: string
          bio?: string | null
          company?: string | null
          position?: string | null
          photo_url?: string | null
          social_links?: Json | null
          topics?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          access_link?: string | null
          email?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          full_name?: string
          bio?: string | null
          company?: string | null
          position?: string | null
          photo_url?: string | null
          social_links?: Json | null
          topics?: string[] | null
          created_at?: string | null
          updated_at?: string | null
          access_link?: string | null
          email?: string | null
        }
      }
      session_speakers: {
        Row: {
          id: string
          session_id: string | null
          speaker_id: string | null
          role: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          speaker_id?: string | null
          role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          speaker_id?: string | null
          role?: string | null
          created_at?: string | null
        }
      }
      event_speakers: {
        Row: {
          id: string
          event_id: string
          speaker_id: string
          role: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          speaker_id: string
          role?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          speaker_id?: string
          role?: string | null
          created_at?: string
        }
      }
      session_messages: {
        Row: {
          id: string
          session_id: string
          user_id: string | null
          speaker_id: string | null
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id?: string | null
          speaker_id?: string | null
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string | null
          speaker_id?: string | null
          content?: string
          created_at?: string
        }
      }
      event_questions: {
        Row: {
          id: string
          event_id: string
          user_id: string
          question: string
          status: 'pending' | 'answered'
          answer: string | null
          answered_at: string | null
          created_at: string
          session_id: string | null
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          question: string
          status?: 'pending' | 'answered'
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          session_id?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          question?: string
          status?: 'pending' | 'answered'
          answer?: string | null
          answered_at?: string | null
          created_at?: string
          session_id?: string | null
        }
      }
      event_registrations: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: 'registered' | 'attended' | 'cancelled'
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          status?: 'registered' | 'attended' | 'cancelled'
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          status?: 'registered' | 'attended' | 'cancelled'
          created_at?: string
        }
      }
      session_registrations: {
        Row: {
          id: string
          session_id: string | null
          user_id: string | null
          status: string | null
          attended: boolean | null
          feedback: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          status?: string | null
          attended?: boolean | null
          feedback?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          user_id?: string | null
          status?: string | null
          attended?: boolean | null
          feedback?: Json | null
          created_at?: string | null
        }
      }
      session_materials: {
        Row: {
          id: string
          session_id: string | null
          title: string
          type: string
          url: string
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          title: string
          type: string
          url: string
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          title?: string
          type?: string
          url?: string
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      session_replays: {
        Row: {
          id: string
          session_id: string | null
          title: string
          recording_url: string
          duration: unknown | null
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          session_id?: string | null
          title: string
          recording_url: string
          duration?: unknown | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          session_id?: string | null
          title?: string
          recording_url?: string
          duration?: unknown | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      speaker_access_tokens: {
        Row: {
          id: string
          session_id: string
          speaker_id: string
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          speaker_id: string
          token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          speaker_id?: string
          token?: string
          expires_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      message_display: {
        Row: {
          id: string | null
          session_id: string | null
          content: string | null
          created_at: string | null
          sender: Json | null
        }
        Insert: {
          id?: string | null
          session_id?: string | null
          content?: string | null
          created_at?: string | null
          sender?: Json | null
        }
        Update: {
          id?: string | null
          session_id?: string | null
          content?: string | null
          created_at?: string | null
          sender?: Json | null
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}