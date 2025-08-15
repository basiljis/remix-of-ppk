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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      checklist: {
        Row: {
          created_at: string
          id: string
          level: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_item: {
        Row: {
          checklist_id: string
          created_at: string
          id: string
          is_required: boolean
          order_index: number
          text: string
          updated_at: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          id?: string
          is_required?: boolean
          order_index?: number
          text: string
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          id?: string
          is_required?: boolean
          order_index?: number
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklist"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string
          district: string | null
          external_id: string | null
          id: string
          is_manual: boolean
          mrsd: string | null
          name: string
          type: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          district?: string | null
          external_id?: string | null
          id?: string
          is_manual?: boolean
          mrsd?: string | null
          name: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          district?: string | null
          external_id?: string | null
          id?: string
          is_manual?: boolean
          mrsd?: string | null
          name?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      protocol_checklist_items: {
        Row: {
          block: string
          block_order: number
          checklist_item_id: string
          created_at: string
          description: string
          education_level_do: boolean
          education_level_noo: boolean
          education_level_oo: boolean
          education_level_soo: boolean
          id: string
          is_disabled: boolean
          score_0_label: string | null
          score_1_label: string | null
          subtopic: string
          subtopic_order: number
          topic: string
          topic_order: number
          updated_at: string
          weight: number
        }
        Insert: {
          block: string
          block_order: number
          checklist_item_id: string
          created_at?: string
          description: string
          education_level_do?: boolean
          education_level_noo?: boolean
          education_level_oo?: boolean
          education_level_soo?: boolean
          id?: string
          is_disabled?: boolean
          score_0_label?: string | null
          score_1_label?: string | null
          subtopic: string
          subtopic_order: number
          topic: string
          topic_order: number
          updated_at?: string
          weight?: number
        }
        Update: {
          block?: string
          block_order?: number
          checklist_item_id?: string
          created_at?: string
          description?: string
          education_level_do?: boolean
          education_level_noo?: boolean
          education_level_oo?: boolean
          education_level_soo?: boolean
          id?: string
          is_disabled?: boolean
          score_0_label?: string | null
          score_1_label?: string | null
          subtopic?: string
          subtopic_order?: number
          topic?: string
          topic_order?: number
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      protocols: {
        Row: {
          checklist_data: Json | null
          child_birth_date: string | null
          child_name: string
          completion_percentage: number | null
          consultation_reason: string | null
          consultation_type: string
          created_at: string
          education_level: string
          id: string
          is_ready: boolean | null
          organization_id: string | null
          protocol_data: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          checklist_data?: Json | null
          child_birth_date?: string | null
          child_name: string
          completion_percentage?: number | null
          consultation_reason?: string | null
          consultation_type: string
          created_at?: string
          education_level: string
          id?: string
          is_ready?: boolean | null
          organization_id?: string | null
          protocol_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          checklist_data?: Json | null
          child_birth_date?: string | null
          child_name?: string
          completion_percentage?: number | null
          consultation_reason?: string | null
          consultation_type?: string
          created_at?: string
          education_level?: string
          id?: string
          is_ready?: boolean | null
          organization_id?: string | null
          protocol_data?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "protocols_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
