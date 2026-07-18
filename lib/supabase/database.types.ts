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
          content_edited_at: string | null;
          thumbnail_url: string | null;
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
          content_edited_at?: string | null;
          thumbnail_url?: string | null;
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
          content_edited_at?: string | null;
          thumbnail_url?: string | null;
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
      google_connections: {
        Row: {
          user_id: string;
          google_email: string;
          access_token_encrypted: string;
          refresh_token_encrypted: string;
          expires_at: string;
          scopes: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          google_email: string;
          access_token_encrypted: string;
          refresh_token_encrypted: string;
          expires_at: string;
          scopes?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          google_email?: string;
          access_token_encrypted?: string;
          refresh_token_encrypted?: string;
          expires_at?: string;
          scopes?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      beta_suggestions: {
        Row: {
          id: string;
          user_id: string | null;
          user_email: string;
          page_url: string | null;
          message: string;
          image_urls: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          user_email?: string;
          page_url?: string | null;
          message: string;
          image_urls?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          user_email?: string;
          page_url?: string | null;
          message?: string;
          image_urls?: string[];
          created_at?: string;
        };
        Relationships: [];
      };
      usage_analysis_snapshots: {
        Row: {
          id: string;
          computed_at: string;
          timezone: string;
          payload: Json;
          stats: Json;
        };
        Insert: {
          id?: string;
          computed_at?: string;
          timezone?: string;
          payload: Json;
          stats?: Json;
        };
        Update: {
          id?: string;
          computed_at?: string;
          timezone?: string;
          payload?: Json;
          stats?: Json;
        };
        Relationships: [];
      };
      visitor_events: {
        Row: {
          id: string;
          created_at: string;
          visitor_id: string;
          path: string | null;
          is_authenticated: boolean;
          referrer_host: string | null;
          source: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          country: string | null;
          region: string | null;
          city: string | null;
          world_region: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          visitor_id: string;
          path?: string | null;
          is_authenticated?: boolean;
          referrer_host?: string | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          world_region?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          visitor_id?: string;
          path?: string | null;
          is_authenticated?: boolean;
          referrer_host?: string | null;
          source?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          country?: string | null;
          region?: string | null;
          city?: string | null;
          world_region?: string | null;
        };
        Relationships: [];
      };
      user_memories: {
        Row: {
          user_id: string;
          content: string;
          pending_notes: string;
          turn_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          content?: string;
          pending_notes?: string;
          turn_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          content?: string;
          pending_notes?: string;
          turn_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      qa_turn_events: {
        Row: {
          id: string;
          created_at: string;
          card_id: string | null;
          canvas_id: string | null;
          question: string | null;
          model: string | null;
          duration_ms: number | null;
          input_tokens: number | null;
          output_tokens: number | null;
          tool_turns: number | null;
          pause_turns: number | null;
          web_search_blocks: number | null;
          artifact_kind: string | null;
          outcome: string;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          card_id?: string | null;
          canvas_id?: string | null;
          question?: string | null;
          model?: string | null;
          duration_ms?: number | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          tool_turns?: number | null;
          pause_turns?: number | null;
          web_search_blocks?: number | null;
          artifact_kind?: string | null;
          outcome: string;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          card_id?: string | null;
          canvas_id?: string | null;
          question?: string | null;
          model?: string | null;
          duration_ms?: number | null;
          input_tokens?: number | null;
          output_tokens?: number | null;
          tool_turns?: number | null;
          pause_turns?: number | null;
          web_search_blocks?: number | null;
          artifact_kind?: string | null;
          outcome?: string;
          error_message?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "qa_turn_events_canvas_id_fkey";
            columns: ["canvas_id"];
            isOneToOne: false;
            referencedRelation: "canvases";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      submit_beta_suggestion: {
        Args: {
          p_message: string;
          p_page_url?: string | null;
          p_image_urls?: string[];
        };
        Returns: string;
      };
      join_canvas_via_share_token: {
        Args: { p_token: string };
        Returns: string | null;
      };
      accept_canvas_invite: {
        Args: { p_invite_id: string };
        Returns: string;
      };
      process_pending_canvas_invites: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
