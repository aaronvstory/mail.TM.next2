export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      email_accounts: {
        Row: {
          id: string
          user_id: string
          mail_tm_id: string
          email_address: string
          created_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          mail_tm_id: string
          email_address: string
          created_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          mail_tm_id?: string
          email_address?: string
          created_at?: string
          is_active?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

