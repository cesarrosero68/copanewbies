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
      goal_events: {
        Row: {
          assist_player_id: string | null
          created_at: string
          id: string
          is_own_goal: boolean
          match_id: string
          own_goal_by_player_id: string | null
          period: Database["public"]["Enums"]["goal_period"]
          scorer_player_id: string | null
          team_id: string
          time_mmss: string
        }
        Insert: {
          assist_player_id?: string | null
          created_at?: string
          id?: string
          is_own_goal?: boolean
          match_id: string
          own_goal_by_player_id?: string | null
          period: Database["public"]["Enums"]["goal_period"]
          scorer_player_id?: string | null
          team_id: string
          time_mmss: string
        }
        Update: {
          assist_player_id?: string | null
          created_at?: string
          id?: string
          is_own_goal?: boolean
          match_id?: string
          own_goal_by_player_id?: string | null
          period?: Database["public"]["Enums"]["goal_period"]
          scorer_player_id?: string | null
          team_id?: string
          time_mmss?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_events_assist_player_id_fkey"
            columns: ["assist_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_events_own_goal_by_player_id_fkey"
            columns: ["own_goal_by_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_events_scorer_player_id_fkey"
            columns: ["scorer_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_team_id: string | null
          away_team_label: string | null
          clock_enabled: boolean | null
          clock_offset_ms: number | null
          clock_started_at: string | null
          created_at: string
          current_period: number | null
          home_team_id: string | null
          home_team_label: string | null
          id: string
          match_number: number | null
          notes: string | null
          ot_played: boolean | null
          ot_winner_team_id: string | null
          period_minutes: number | null
          reg_away_score: number | null
          reg_home_score: number | null
          so_played: boolean | null
          so_winner_team_id: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          start_time: string | null
          status: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at: string
          venue: string | null
          venue_maps_url: string | null
          winner_team_id: string | null
        }
        Insert: {
          away_team_id?: string | null
          away_team_label?: string | null
          clock_enabled?: boolean | null
          clock_offset_ms?: number | null
          clock_started_at?: string | null
          created_at?: string
          current_period?: number | null
          home_team_id?: string | null
          home_team_label?: string | null
          id?: string
          match_number?: number | null
          notes?: string | null
          ot_played?: boolean | null
          ot_winner_team_id?: string | null
          period_minutes?: number | null
          reg_away_score?: number | null
          reg_home_score?: number | null
          so_played?: boolean | null
          so_winner_team_id?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          start_time?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id: string
          updated_at?: string
          venue?: string | null
          venue_maps_url?: string | null
          winner_team_id?: string | null
        }
        Update: {
          away_team_id?: string | null
          away_team_label?: string | null
          clock_enabled?: boolean | null
          clock_offset_ms?: number | null
          clock_started_at?: string | null
          created_at?: string
          current_period?: number | null
          home_team_id?: string | null
          home_team_label?: string | null
          id?: string
          match_number?: number | null
          notes?: string | null
          ot_played?: boolean | null
          ot_winner_team_id?: string | null
          period_minutes?: number | null
          reg_away_score?: number | null
          reg_home_score?: number | null
          so_played?: boolean | null
          so_winner_team_id?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          start_time?: string | null
          status?: Database["public"]["Enums"]["match_status"]
          tournament_id?: string
          updated_at?: string
          venue?: string | null
          venue_maps_url?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_ot_winner_team_id_fkey"
            columns: ["ot_winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_so_winner_team_id_fkey"
            columns: ["so_winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_events: {
        Row: {
          created_at: string
          duration_mmss: string
          ended_at: string | null
          ended_early: boolean | null
          id: string
          match_id: string
          penalty_type: string
          period: string
          player_id: string
          team_id: string
          time_mmss: string
          tournament_id: string | null
        }
        Insert: {
          created_at?: string
          duration_mmss?: string
          ended_at?: string | null
          ended_early?: boolean | null
          id?: string
          match_id: string
          penalty_type: string
          period: string
          player_id: string
          team_id: string
          time_mmss: string
          tournament_id?: string | null
        }
        Update: {
          created_at?: string
          duration_mmss?: string
          ended_at?: string | null
          ended_early?: boolean | null
          id?: string
          match_id?: string
          penalty_type?: string
          period?: string
          player_id?: string
          team_id?: string
          time_mmss?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "penalty_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penalty_events_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      player_stats_aggregate: {
        Row: {
          assists: number
          goals: number
          id: string
          player_id: string
          points: number
          team_id: string
          tournament_id: string
          updated_at: string | null
        }
        Insert: {
          assists?: number
          goals?: number
          id?: string
          player_id: string
          points?: number
          team_id: string
          tournament_id: string
          updated_at?: string | null
        }
        Update: {
          assists?: number
          goals?: number
          id?: string
          player_id?: string
          points?: number
          team_id?: string
          tournament_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "player_stats_aggregate_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_aggregate_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_stats_aggregate_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          birth_date: string | null
          created_at: string
          first_name: string | null
          id: string
          is_captain: boolean | null
          jersey_number: number
          last_name: string | null
          name: string
          phone: string | null
          position: string | null
          team_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_captain?: boolean | null
          jersey_number: number
          last_name?: string | null
          name: string
          phone?: string | null
          position?: string | null
          team_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          is_captain?: boolean | null
          jersey_number?: number
          last_name?: string | null
          name?: string
          phone?: string | null
          position?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      site_theme: {
        Row: {
          accent_color: string
          background_color: string
          border_color: string
          font_family: string
          font_size_base: string
          id: number
          logo_url: string | null
          primary_color: string
          text_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          background_color?: string
          border_color?: string
          font_family?: string
          font_size_base?: string
          id?: number
          logo_url?: string | null
          primary_color?: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          background_color?: string
          border_color?: string
          font_family?: string
          font_size_base?: string
          id?: number
          logo_url?: string | null
          primary_color?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      skills_players: {
        Row: {
          club: string
          consecutive_number: number
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["skills_role"]
          tournament_id: string | null
        }
        Insert: {
          club: string
          consecutive_number: number
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["skills_role"]
          tournament_id?: string | null
        }
        Update: {
          club?: string
          consecutive_number?: number
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["skills_role"]
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_players_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_point_tables: {
        Row: {
          config: Json
          id: string
          table_name: string
          tournament_id: string | null
        }
        Insert: {
          config?: Json
          id?: string
          table_name: string
          tournament_id?: string | null
        }
        Update: {
          config?: Json
          id?: string
          table_name?: string
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_point_tables_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_results: {
        Row: {
          attempt_number: number | null
          created_at: string
          entered_by: string | null
          id: string
          player_id: string
          score_direct: number | null
          shootout_result: string | null
          sniper_target: string | null
          test_number: number
          time_milliseconds: number | null
          time_minutes: number | null
          time_seconds: number | null
          tournament_id: string | null
        }
        Insert: {
          attempt_number?: number | null
          created_at?: string
          entered_by?: string | null
          id?: string
          player_id: string
          score_direct?: number | null
          shootout_result?: string | null
          sniper_target?: string | null
          test_number: number
          time_milliseconds?: number | null
          time_minutes?: number | null
          time_seconds?: number | null
          tournament_id?: string | null
        }
        Update: {
          attempt_number?: number | null
          created_at?: string
          entered_by?: string | null
          id?: string
          player_id?: string
          score_direct?: number | null
          shootout_result?: string | null
          sniper_target?: string | null
          test_number?: number
          time_milliseconds?: number | null
          time_minutes?: number | null
          time_seconds?: number | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "skills_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_results_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "skills_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skills_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_users: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          tournament_id: string | null
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          tournament_id?: string | null
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          tournament_id?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "skills_users_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsors: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          logo_url: string | null
          name: string
          speed: string | null
          tournament_id: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          logo_url?: string | null
          name: string
          speed?: string | null
          tournament_id?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          speed?: string | null
          tournament_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sponsors_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      standings_aggregate: {
        Row: {
          draws: number
          gc: number
          gd: number
          gf: number
          id: string
          losses: number
          played: number
          points: number
          rank: number | null
          rank_calculated_at: string | null
          team_id: string
          tournament_id: string
          wins: number
        }
        Insert: {
          draws?: number
          gc?: number
          gd?: number
          gf?: number
          id?: string
          losses?: number
          played?: number
          points?: number
          rank?: number | null
          rank_calculated_at?: string | null
          team_id: string
          tournament_id: string
          wins?: number
        }
        Update: {
          draws?: number
          gc?: number
          gd?: number
          gf?: number
          id?: string
          losses?: number
          played?: number
          points?: number
          rank?: number | null
          rank_calculated_at?: string | null
          team_id?: string
          tournament_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "standings_aggregate_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standings_aggregate_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      team_staff: {
        Row: {
          created_at: string | null
          first_name: string
          id: string
          last_name: string
          role: string | null
          team_id: string | null
        }
        Insert: {
          created_at?: string | null
          first_name: string
          id?: string
          last_name: string
          role?: string | null
          team_id?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
          role?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_staff_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          tournament_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          tournament_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_awards: {
        Row: {
          award_type: string
          created_at: string | null
          id: string
          player_id: string | null
          tournament_id: string | null
        }
        Insert: {
          award_type: string
          created_at?: string | null
          id?: string
          player_id?: string | null
          tournament_id?: string | null
        }
        Update: {
          award_type?: string
          created_at?: string | null
          id?: string
          player_id?: string | null
          tournament_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_awards_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_awards_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          bg_color: string | null
          created_at: string
          font_family: string | null
          font_size: string | null
          footer_color: string | null
          header_color: string | null
          hero_color: string | null
          hero_logo_url: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          rules_json: Json | null
          season: string
          semester: string | null
          sponsors_enabled: boolean | null
          status: string
          text_color: string | null
          title_color: string | null
          year: number | null
        }
        Insert: {
          bg_color?: string | null
          created_at?: string
          font_family?: string | null
          font_size?: string | null
          footer_color?: string | null
          header_color?: string | null
          hero_color?: string | null
          hero_logo_url?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          rules_json?: Json | null
          season: string
          semester?: string | null
          sponsors_enabled?: boolean | null
          status?: string
          text_color?: string | null
          title_color?: string | null
          year?: number | null
        }
        Update: {
          bg_color?: string | null
          created_at?: string
          font_family?: string | null
          font_size?: string | null
          footer_color?: string | null
          header_color?: string | null
          hero_color?: string | null
          hero_logo_url?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          rules_json?: Json | null
          season?: string
          semester?: string | null
          sponsors_enabled?: boolean | null
          status?: string
          text_color?: string | null
          title_color?: string | null
          year?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_config: {
        Row: {
          created_at: string
          enabled: boolean | null
          id: string
          tournament_id: string
          updated_at: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          tournament_id: string
          updated_at?: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          id?: string
          tournament_id?: string
          updated_at?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_config_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_active_tournament_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_player_stats: {
        Args: { p_tournament_id: string }
        Returns: undefined
      }
      recalculate_standings: {
        Args: { p_tournament_id: string }
        Returns: undefined
      }
      verify_skills_login: {
        Args: { p_password: string; p_username: string }
        Returns: {
          user_id: string
          user_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      goal_period: "1" | "2" | "3" | "OT"
      match_stage: "REGULAR" | "P1A" | "P1B" | "SEMI" | "P2" | "FINAL" | "THIRD"
      match_status: "scheduled" | "live" | "final" | "locked"
      skills_role: "field" | "goalkeeper"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      goal_period: ["1", "2", "3", "OT"],
      match_stage: ["REGULAR", "P1A", "P1B", "SEMI", "P2", "FINAL", "THIRD"],
      match_status: ["scheduled", "live", "final", "locked"],
      skills_role: ["field", "goalkeeper"],
    },
  },
} as const
