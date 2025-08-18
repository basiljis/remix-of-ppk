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
      api_logs: {
        Row: {
          action_type: string
          created_at: string
          endpoint: string | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          request_data: Json | null
          response_data: Json | null
          status_code: number | null
        }
        Insert: {
          action_type: string
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
        }
        Update: {
          action_type?: string
          created_at?: string
          endpoint?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          request_data?: Json | null
          response_data?: Json | null
          status_code?: number | null
        }
        Relationships: []
      }
      api_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          service_name: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          service_name?: string
          token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          service_name?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      instructions: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_active: boolean
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_addresses: {
        Row: {
          address_type: string
          building: string | null
          city: string | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string
          district: string | null
          full_address: string
          id: string
          is_main_building: boolean | null
          metro_station: string | null
          organization_id: string
          postal_code: string | null
          region: string | null
          street: string | null
          updated_at: string
        }
        Insert: {
          address_type?: string
          building?: string | null
          city?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          district?: string | null
          full_address: string
          id?: string
          is_main_building?: boolean | null
          metro_station?: string | null
          organization_id: string
          postal_code?: string | null
          region?: string | null
          street?: string | null
          updated_at?: string
        }
        Update: {
          address_type?: string
          building?: string | null
          city?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          district?: string | null
          full_address?: string
          id?: string
          is_main_building?: boolean | null
          metro_station?: string | null
          organization_id?: string
          postal_code?: string | null
          region?: string | null
          street?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_addresses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_reorganizations: {
        Row: {
          created_at: string
          ekis_in: string | null
          ekis_out: string | null
          event_comments: string | null
          event_date: string | null
          event_type_name: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ekis_in?: string | null
          ekis_out?: string | null
          event_comments?: string | null
          event_date?: string | null
          event_type_name: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ekis_in?: string | null
          ekis_out?: string | null
          event_comments?: string | null
          event_date?: string | null
          event_type_name?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_reorganizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          api_token: string | null
          coordinates_lat: number | null
          coordinates_lng: number | null
          created_at: string
          district: string | null
          ekis_id: string | null
          email: string | null
          external_id: string | null
          full_name: string | null
          has_education_activity: boolean | null
          id: string
          is_archived: boolean | null
          is_manual: boolean
          last_sync_at: string | null
          metro_station: string | null
          mrsd: string | null
          name: string
          parent_organization: string | null
          phone: string | null
          short_name: string | null
          status_id: number | null
          status_name: string | null
          token_expires_at: string | null
          type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          api_token?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          district?: string | null
          ekis_id?: string | null
          email?: string | null
          external_id?: string | null
          full_name?: string | null
          has_education_activity?: boolean | null
          id?: string
          is_archived?: boolean | null
          is_manual?: boolean
          last_sync_at?: string | null
          metro_station?: string | null
          mrsd?: string | null
          name: string
          parent_organization?: string | null
          phone?: string | null
          short_name?: string | null
          status_id?: number | null
          status_name?: string | null
          token_expires_at?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          api_token?: string | null
          coordinates_lat?: number | null
          coordinates_lng?: number | null
          created_at?: string
          district?: string | null
          ekis_id?: string | null
          email?: string | null
          external_id?: string | null
          full_name?: string | null
          has_education_activity?: boolean | null
          id?: string
          is_archived?: boolean | null
          is_manual?: boolean
          last_sync_at?: string | null
          metro_station?: string | null
          mrsd?: string | null
          name?: string
          parent_organization?: string | null
          phone?: string | null
          short_name?: string | null
          status_id?: number | null
          status_name?: string | null
          token_expires_at?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
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
          meeting_type: string | null
          organization_id: string | null
          ppk_number: string | null
          protocol_data: Json | null
          sequence_number: number
          session_topic: string | null
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
          meeting_type?: string | null
          organization_id?: string | null
          ppk_number?: string | null
          protocol_data?: Json | null
          sequence_number?: number
          session_topic?: string | null
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
          meeting_type?: string | null
          organization_id?: string | null
          ppk_number?: string | null
          protocol_data?: Json | null
          sequence_number?: number
          session_topic?: string | null
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
      generate_protocol_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
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
