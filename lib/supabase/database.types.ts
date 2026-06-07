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
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      canvases: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          state: Json;
          version: number;
          is_default: boolean;
          allow_viewer_duplicate: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title?: string;
          state?: Json;
          version?: number;
          is_default?: boolean;
          allow_viewer_duplicate?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          state?: Json;
          version?: number;
          is_default?: boolean;
          allow_viewer_duplicate?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "canvases_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      canvas_collaborators: {
        Row: {
          canvas_id: string;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          invited_at: string;
        };
        Insert: {
          canvas_id: string;
          user_id: string;
          role: "owner" | "editor" | "viewer";
          invited_at?: string;
        };
        Update: {
          canvas_id?: string;
          user_id?: string;
          role?: "owner" | "editor" | "viewer";
          invited_at?: string;
        };
        Relationships: [];
      };
      canvas_invites: {
        Row: {
          id: string;
          canvas_id: string;
          email: string;
          role: "editor" | "viewer";
          invited_by: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
        };
        Insert: {
          id?: string;
          canvas_id: string;
          email: string;
          role: "editor" | "viewer";
          invited_by: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
        };
        Update: {
          id?: string;
          canvas_id?: string;
          email?: string;
          role?: "editor" | "viewer";
          invited_by?: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
        };
        Relationships: [];
      };
      canvas_share_links: {
        Row: {
          id: string;
          canvas_id: string;
          token: string;
          created_by: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          canvas_id: string;
          token?: string;
          created_by: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          canvas_id?: string;
          token?: string;
          created_by?: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
