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
      access_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          organization_id: string | null
          phone: string
          position_id: string
          region_id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          organization_id?: string | null
          phone: string
          position_id: string
          region_id: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          organization_id?: string | null
          phone?: string
          position_id?: string
          region_id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
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
      change_history: {
        Row: {
          action: string
          changed_at: string
          changed_by: string | null
          changes_summary: string | null
          created_at: string
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string
          changed_by?: string | null
          changes_summary?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string
          changed_by?: string | null
          changes_summary?: string | null
          created_at?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
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
      children: {
        Row: {
          birth_date: string | null
          created_at: string
          education_level: string | null
          full_name: string
          gender: string | null
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          education_level?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          education_level?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_offer_requests: {
        Row: {
          admin_notes: string | null
          comment: string | null
          contact_person: string
          created_at: string
          email: string
          id: string
          inn: string
          organization_name: string
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          comment?: string | null
          contact_person: string
          created_at?: string
          email: string
          id?: string
          inn: string
          organization_name: string
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          comment?: string | null
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          inn?: string
          organization_name?: string
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_body: string | null
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient: string
          resend_id: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_body?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient: string
          resend_id?: string | null
          status: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_body?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string
          resend_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          org_edit: boolean
          org_view: boolean
          organization_id: string
          ppk_create: boolean
          ppk_edit: boolean
          ppk_view: boolean
          schedule_organization: boolean
          schedule_personal: boolean
          statistics_view: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          org_edit?: boolean
          org_view?: boolean
          organization_id: string
          ppk_create?: boolean
          ppk_edit?: boolean
          ppk_view?: boolean
          schedule_organization?: boolean
          schedule_personal?: boolean
          statistics_view?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          org_edit?: boolean
          org_view?: boolean
          organization_id?: string
          ppk_create?: boolean
          ppk_edit?: boolean
          ppk_view?: boolean
          schedule_organization?: boolean
          schedule_personal?: boolean
          statistics_view?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_permissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          browser_info: Json | null
          component_name: string | null
          created_at: string | null
          error_message: string
          error_stack: string | null
          error_type: string
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          route: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser_info?: Json | null
          component_name?: string | null
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          error_type: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser_info?: Json | null
          component_name?: string | null
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          error_type?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      holiday_session_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          holiday_id: string | null
          id: string
          organization_id: string
          requested_by: string
          requested_date: string
          reviewed_at: string | null
          reviewed_by: string | null
          session_data: Json
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          holiday_id?: string | null
          id?: string
          organization_id: string
          requested_by: string
          requested_date: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_data: Json
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          holiday_id?: string | null
          id?: string
          organization_id?: string
          requested_by?: string
          requested_date?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          session_data?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holiday_session_requests_holiday_id_fkey"
            columns: ["holiday_id"]
            isOneToOne: false
            referencedRelation: "organization_holidays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holiday_session_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_files: {
        Row: {
          created_at: string
          file_data: string
          file_size: number
          file_type: string
          filename: string
          id: string
          instruction_id: string | null
          original_name: string
          section_id: string
          subsection_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_data: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          instruction_id?: string | null
          original_name: string
          section_id: string
          subsection_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_data?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          instruction_id?: string | null
          original_name?: string
          section_id?: string
          subsection_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruction_files_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "instructions"
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
      organization_api_credentials: {
        Row: {
          api_token: string
          created_at: string
          id: string
          organization_id: string
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          api_token: string
          created_at?: string
          id?: string
          organization_id: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          api_token?: string
          created_at?: string
          id?: string
          organization_id?: string
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_api_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_holidays: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          holiday_date: string
          id: string
          is_recurring: boolean | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          holiday_date: string
          id?: string
          is_recurring?: boolean | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          holiday_date?: string
          id?: string
          is_recurring?: boolean | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_holidays_organization_id_fkey"
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
          region_id: string | null
          short_name: string | null
          status_id: number | null
          status_name: string | null
          type: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
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
          region_id?: string | null
          short_name?: string | null
          status_id?: number | null
          status_name?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
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
          region_id?: string | null
          short_name?: string | null
          status_id?: number | null
          status_name?: string | null
          type?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_logs: {
        Row: {
          amount: number | null
          created_at: string | null
          event_type: string
          id: string
          payment_id: string
          processed: boolean | null
          raw_data: Json | null
          status: string
          subscription_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          payment_id: string
          processed?: boolean | null
          raw_data?: Json | null
          status: string
          subscription_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          payment_id?: string
          processed?: boolean | null
          raw_data?: Json | null
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          email_notifications: boolean | null
          full_name: string
          id: string
          is_blocked: boolean
          notifications_enabled: boolean | null
          organization_id: string | null
          phone: string
          position_id: string
          region_id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          email_notifications?: boolean | null
          full_name: string
          id: string
          is_blocked?: boolean
          notifications_enabled?: boolean | null
          organization_id?: string | null
          phone: string
          position_id: string
          region_id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_notifications?: boolean | null
          full_name?: string
          id?: string
          is_blocked?: boolean
          notifications_enabled?: boolean | null
          organization_id?: string | null
          phone?: string
          position_id?: string
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
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
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      school_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          label: string
          start_date: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          label: string
          start_date: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          label?: string
          start_date?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      session_duration_settings: {
        Row: {
          age_from: number
          age_label: string
          age_to: number
          created_at: string
          id: string
          max_sessions_per_day: number
          max_sessions_per_week: number
          session_duration_minutes: number
          updated_at: string
        }
        Insert: {
          age_from: number
          age_label: string
          age_to: number
          created_at?: string
          id?: string
          max_sessions_per_day?: number
          max_sessions_per_week?: number
          session_duration_minutes?: number
          updated_at?: string
        }
        Update: {
          age_from?: number
          age_label?: string
          age_to?: number
          created_at?: string
          id?: string
          max_sessions_per_day?: number
          max_sessions_per_week?: number
          session_duration_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      session_statuses: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      session_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          actual_duration_minutes: number | null
          cancellation_reason: string | null
          cancellation_token: string | null
          cancelled_at: string | null
          cancelled_by_parent: boolean | null
          child_id: string
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          notes: string | null
          organization_id: string | null
          protocol_id: string | null
          scheduled_date: string
          session_status_id: string
          session_type_id: string
          specialist_id: string
          start_time: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          actual_duration_minutes?: number | null
          cancellation_reason?: string | null
          cancellation_token?: string | null
          cancelled_at?: string | null
          cancelled_by_parent?: boolean | null
          child_id: string
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          protocol_id?: string | null
          scheduled_date: string
          session_status_id: string
          session_type_id: string
          specialist_id: string
          start_time: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          actual_duration_minutes?: number | null
          cancellation_reason?: string | null
          cancellation_token?: string | null
          cancelled_at?: string | null
          cancelled_by_parent?: boolean | null
          child_id?: string
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          protocol_id?: string | null
          scheduled_date?: string
          session_status_id?: string
          session_type_id?: string
          specialist_id?: string
          start_time?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_session_status_id_fkey"
            columns: ["session_status_id"]
            isOneToOne: false
            referencedRelation: "session_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_session_type_id_fkey"
            columns: ["session_type_id"]
            isOneToOne: false
            referencedRelation: "session_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_specialist_id_fkey"
            columns: ["specialist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_goals: {
        Row: {
          created_at: string
          created_by: string | null
          current_value: number
          goal_name: string
          goal_type: string
          id: string
          is_active: boolean
          notes: string | null
          organization_id: string | null
          period_end: string
          period_start: string
          period_type: string
          target_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_value?: number
          goal_name: string
          goal_type: string
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string | null
          period_end: string
          period_start: string
          period_type?: string
          target_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_value?: number
          goal_name?: string
          goal_type?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          organization_id?: string | null
          period_end?: string
          period_start?: string
          period_type?: string
          target_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_goals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_rates: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          rate: number
          set_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          rate?: number
          set_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          rate?: number
          set_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_rates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      specialist_workload_settings: {
        Row: {
          created_at: string
          hours_per_rate: number
          id: string
          max_hours_per_day: number
          max_hours_per_week: number
          max_hours_per_year: number
          position_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hours_per_rate?: number
          id?: string
          max_hours_per_day?: number
          max_hours_per_week?: number
          max_hours_per_year?: number
          position_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hours_per_rate?: number
          id?: string
          max_hours_per_day?: number
          max_hours_per_week?: number
          max_hours_per_year?: number
          position_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "specialist_workload_settings_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: true
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          contact_person: string
          created_at: string | null
          email: string
          id: string
          inn: string
          kpp: string | null
          legal_address: string
          organization_name: string
          phone: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          subscription_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          contact_person: string
          created_at?: string | null
          email: string
          id?: string
          inn: string
          kpp?: string | null
          legal_address: string
          organization_name: string
          phone: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          contact_person?: string
          created_at?: string | null
          email?: string
          id?: string
          inn?: string
          kpp?: string | null
          legal_address?: string
          organization_name?: string
          phone?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          subscription_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          end_date: string | null
          id: string
          legal_entity_data: Json | null
          organization_id: string | null
          payment_id: string | null
          payment_type: string
          reminder_1day_sent: boolean | null
          reminder_3days_sent: boolean | null
          reminder_7days_sent: boolean | null
          start_date: string | null
          status: string
          subscription_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          legal_entity_data?: Json | null
          organization_id?: string | null
          payment_id?: string | null
          payment_type: string
          reminder_1day_sent?: boolean | null
          reminder_3days_sent?: boolean | null
          reminder_7days_sent?: boolean | null
          start_date?: string | null
          status?: string
          subscription_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          end_date?: string | null
          id?: string
          legal_entity_data?: Json | null
          organization_id?: string | null
          payment_id?: string | null
          payment_type?: string
          reminder_1day_sent?: boolean | null
          reminder_3days_sent?: boolean | null
          reminder_7days_sent?: boolean | null
          start_date?: string | null
          status?: string
          subscription_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_schedules: {
        Row: {
          created_at: string
          friday_end: string | null
          friday_start: string | null
          id: string
          monday_end: string | null
          monday_start: string | null
          notes: string | null
          organization_id: string
          saturday_end: string | null
          saturday_start: string | null
          sunday_end: string | null
          sunday_start: string | null
          thursday_end: string | null
          thursday_start: string | null
          tuesday_end: string | null
          tuesday_start: string | null
          updated_at: string
          user_id: string
          wednesday_end: string | null
          wednesday_start: string | null
        }
        Insert: {
          created_at?: string
          friday_end?: string | null
          friday_start?: string | null
          id?: string
          monday_end?: string | null
          monday_start?: string | null
          notes?: string | null
          organization_id: string
          saturday_end?: string | null
          saturday_start?: string | null
          sunday_end?: string | null
          sunday_start?: string | null
          thursday_end?: string | null
          thursday_start?: string | null
          tuesday_end?: string | null
          tuesday_start?: string | null
          updated_at?: string
          user_id: string
          wednesday_end?: string | null
          wednesday_start?: string | null
        }
        Update: {
          created_at?: string
          friday_end?: string | null
          friday_start?: string | null
          id?: string
          monday_end?: string | null
          monday_start?: string | null
          notes?: string | null
          organization_id?: string
          saturday_end?: string | null
          saturday_start?: string | null
          sunday_end?: string | null
          sunday_start?: string | null
          thursday_end?: string | null
          thursday_start?: string | null
          tuesday_end?: string | null
          tuesday_start?: string | null
          updated_at?: string
          user_id?: string
          wednesday_end?: string | null
          wednesday_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_organization_id_fkey"
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
      generate_protocol_number: { Args: never; Returns: string }
      get_organization_subscription_end_date: {
        Args: { _user_id: string }
        Returns: string
      }
      get_user_organization: { Args: { _user_id: string }; Returns: string }
      get_user_region: { Args: { _user_id: string }; Returns: string }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_organization_subscription: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "admin"
        | "regional_operator"
        | "user"
        | "organization_admin"
        | "director"
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
      app_role: [
        "admin",
        "regional_operator",
        "user",
        "organization_admin",
        "director",
      ],
    },
  },
} as const
