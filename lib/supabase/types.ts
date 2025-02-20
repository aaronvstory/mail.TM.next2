export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      email_accounts: {
        Row: {
          id: string;
          user_id: string;
          mail_tm_id: string;
          email_address: string;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          mail_tm_id: string;
          email_address: string;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          mail_tm_id?: string;
          email_address?: string;
          created_at?: string;
          is_active?: boolean;
        };
      };
      emails: {
        Row: {
          message_id: string;
          account_email: string;
          from_address: string;
          from_name: string | null;
          to_addresses: Json;
          subject: string;
          intro: string | null;
          text_content: string | null;
          html_content: string | null;
          seen: boolean;
          is_deleted: boolean;
          has_attachments: boolean;
          size: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          message_id: string;
          account_email: string;
          from_address: string;
          from_name?: string | null;
          to_addresses: Json;
          subject: string;
          intro?: string | null;
          text_content?: string | null;
          html_content?: string | null;
          seen?: boolean;
          is_deleted?: boolean;
          has_attachments?: boolean;
          size?: number | null;
          created_at: string;
          updated_at: string;
        };
        Update: {
          message_id?: string;
          account_email?: string;
          from_address?: string | null;
          from_name?: string | null;
          to_addresses?: Json;
          subject?: string;
          intro?: string | null;
          text_content?: string | null;
          html_content?: string | null;
          seen?: boolean;
          is_deleted?: boolean;
          has_attachments?: boolean;
          size?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
