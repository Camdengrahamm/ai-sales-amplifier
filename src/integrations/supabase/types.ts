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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clicks: {
        Row: {
          coach_id: string
          contact_email: string | null
          created_at: string | null
          id: string
          ip_hash: string | null
          offer_id: string
          session_id: string
          source_channel: string | null
          user_agent: string | null
        }
        Insert: {
          coach_id: string
          contact_email?: string | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          offer_id: string
          session_id: string
          source_channel?: string | null
          user_agent?: string | null
        }
        Update: {
          coach_id?: string
          contact_email?: string | null
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          offer_id?: string
          session_id?: string
          source_channel?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clicks_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clicks_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      coaches: {
        Row: {
          brand_name: string | null
          created_at: string | null
          default_commission_rate: number | null
          email: string
          id: string
          main_checkout_url: string | null
          name: string
          user_id: string
        }
        Insert: {
          brand_name?: string | null
          created_at?: string | null
          default_commission_rate?: number | null
          email: string
          id?: string
          main_checkout_url?: string | null
          name: string
          user_id: string
        }
        Update: {
          brand_name?: string | null
          created_at?: string | null
          default_commission_rate?: number | null
          email?: string
          id?: string
          main_checkout_url?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      course_files: {
        Row: {
          coach_id: string
          created_at: string | null
          file_url: string
          filename: string
          id: string
          processed: boolean | null
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          file_url: string
          filename: string
          id?: string
          processed?: boolean | null
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          file_url?: string
          filename?: string
          id?: string
          processed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "course_files_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_sessions: {
        Row: {
          coach_id: string
          created_at: string | null
          id: string
          last_question_at: string | null
          question_count: number | null
          user_handle: string
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          id?: string
          last_question_at?: string | null
          question_count?: number | null
          user_handle: string
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          id?: string
          last_question_at?: string | null
          question_count?: number | null
          user_handle?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_sessions_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      embeddings: {
        Row: {
          coach_id: string
          content_chunk: string
          created_at: string | null
          embedding_vector: string | null
          id: string
        }
        Insert: {
          coach_id: string
          content_chunk: string
          created_at?: string | null
          embedding_vector?: string | null
          id?: string
        }
        Update: {
          coach_id?: string
          content_chunk?: string
          created_at?: string | null
          embedding_vector?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "embeddings_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          base_price: number
          coach_id: string
          commission_rate: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          target_url: string | null
          tracking_slug: string
        }
        Insert: {
          base_price: number
          coach_id: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          target_url?: string | null
          tracking_slug: string
        }
        Update: {
          base_price?: number
          coach_id?: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          target_url?: string | null
          tracking_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          coach_id: string
          created_at: string | null
          id: string
          notes: string | null
          period_end: string
          period_start: string
          status: string | null
          total_commission_due: number
          total_sales_amount: number
        }
        Insert: {
          coach_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          status?: string | null
          total_commission_due: number
          total_sales_amount: number
        }
        Update: {
          coach_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          status?: string | null
          total_commission_due?: number
          total_sales_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payouts_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount: number
          click_id: string | null
          coach_id: string
          commission_due: number
          commission_rate_used: number
          contact_email: string
          created_at: string | null
          currency: string | null
          external_sale_id: string
          id: string
          offer_id: string | null
          purchased_at: string
          source: string | null
        }
        Insert: {
          amount: number
          click_id?: string | null
          coach_id: string
          commission_due: number
          commission_rate_used: number
          contact_email: string
          created_at?: string | null
          currency?: string | null
          external_sale_id: string
          id?: string
          offer_id?: string | null
          purchased_at: string
          source?: string | null
        }
        Update: {
          amount?: number
          click_id?: string | null
          coach_id?: string
          commission_due?: number
          commission_rate_used?: number
          contact_email?: string
          created_at?: string | null
          currency?: string | null
          external_sale_id?: string
          id?: string
          offer_id?: string | null
          purchased_at?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "clicks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_coach_id_fkey"
            columns: ["coach_id"]
            isOneToOne: false
            referencedRelation: "coaches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      make_user_admin: { Args: { user_email: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "coach"
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
      app_role: ["admin", "coach"],
    },
  },
} as const
