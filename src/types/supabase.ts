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
      clients: {
        Row: {
          id: number // si auto-increment (BIGSERIAL / int8)
          uid: string
          full_name: string
          city: string
          address: string
          coop: string
          contacts: string // stocke phone/email en JSON
          payment: string
          fb_link: string
          created_at: string
          updated_at: string | null
          purchases: number // nombre d'achats
        }
        Insert: {
          id?: number
          uid: string
          full_name: string
          city: string
          address: string
          coop: string
          contacts: string
          payment: string
          fb_link: string
          created_at?: string
          updated_at?: string | null
          purchases?: number
        }
        Update: {
          id?: number
          uid?: string
          full_name?: string
          city?: string
          address?: string
          coop?: string
          contacts?: string
          payment?: string
          fb_link?: string
          created_at?: string
          updated_at?: string | null
          purchases?: number
        }
      }

      products: {
        Row: {
          id: string
          name: string
          type: string
          quantity: number
          purchase_price: number
          supplier: string
          in_stock: boolean
          created_at: string
          creator_id: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          quantity?: number
          purchase_price?: number
          supplier?: string
          in_stock?: boolean
          created_at?: string
          creator_id: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          quantity?: number
          purchase_price?: number
          supplier?: string
          in_stock?: boolean
          created_at?: string
          creator_id?: string
        }
      }
      orders: {
        Row: {
          id: number
          uid: string
          creator: string | null
          client: string | null
          article: Json | null
          total: number | null
          remain: number | null
          payment: string | null
          comment: string | null
          package: string | null
          status: string | null
          created_at: string
          sale_id: string | null
        }
        Insert: {
          id?: number
          uid?: string
          creator?: string | null
          client?: string | null
          article?: Json | null
          total?: number | null
          remain?: number | null
          payment?: string | null
          comment?: string | null
          package?: string | null
          status?: string | null
          created_at?: string
          sale_id?: string | null
        }
        Update: {
          id?: number
          uid?: string
          creator?: string | null
          client?: string | null
          article?: Json | null
          total?: number | null
          remain?: number | null
          payment?: string | null
          comment?: string | null
          package?: string | null
          status?: string | null
          created_at?: string
          sale_id?: string | null
        }
      }
      sales: {
        Row: {
          id: number
          uid: string
          title: string | null
          product_id: string | null
          description: string | null
          quantity: string | null
          prices: number[] | null
          creator: string | null
          created_at: string
          end_time: string | null
        }
        Insert: {
          id?: number
          uid?: string
          title?: string | null
          product_id?: string | null
          description?: string | null
          quantity?: string | null
          prices?: number[] | null
          creator?: string | null
          created_at?: string
          end_time?: string | null
        }
        Update: {
          id?: number
          uid?: string
          title?: string | null
          product_id?: string | null
          description?: string | null
          quantity?: string | null
          prices?: number[] | null
          creator?: string | null
          created_at?: string
          end_time?: string | null
        }
      }
      users: {
        Row: {
          id: string
          username: string
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
          username: string
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
          username?: string
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