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
      admin_todos: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean
          priority: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          priority?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean
          priority?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_clients: {
        Row: {
          affiliate_id: string
          assigned_at: string
          assigned_by: string | null
          id: string
          retailer_user_id: string
        }
        Insert: {
          affiliate_id: string
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          retailer_user_id: string
        }
        Update: {
          affiliate_id?: string
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          retailer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clients_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_pct: number
          created_at: string
          id: string
          is_manager_share: boolean
          parent_commission_id: string | null
          payment_amount: number
          retailer_user_id: string
          status: string
          subscription_id: string | null
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          id?: string
          is_manager_share?: boolean
          parent_commission_id?: string | null
          payment_amount?: number
          retailer_user_id: string
          status?: string
          subscription_id?: string | null
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_pct?: number
          created_at?: string
          id?: string
          is_manager_share?: boolean
          parent_commission_id?: string | null
          payment_amount?: number
          retailer_user_id?: string
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_parent_commission_id_fkey"
            columns: ["parent_commission_id"]
            isOneToOne: false
            referencedRelation: "affiliate_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_invites: {
        Row: {
          accepted_at: string | null
          affiliate_id: string
          created_at: string
          created_by: string
          id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          affiliate_id: string
          created_at?: string
          created_by: string
          id?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          affiliate_id?: string
          created_at?: string
          created_by?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_invites_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          auth_user_id: string | null
          commission_pct: number
          created_at: string
          created_by: string | null
          deleted_at: string | null
          email: string
          first_name: string
          id: string
          is_manager: boolean
          last_name: string
          manager_id: string | null
          team_commission_pct: number | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          commission_pct?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email: string
          first_name: string
          id?: string
          is_manager?: boolean
          last_name: string
          manager_id?: string | null
          team_commission_pct?: number | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          commission_pct?: number
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_manager?: boolean
          last_name?: string
          manager_id?: string | null
          team_commission_pct?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string | null
          id: string
          messages: Json
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          sort_order: number | null
          subcategory: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          sort_order?: number | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          sort_order?: number | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_suggestions: {
        Row: {
          created_at: string
          data: Json | null
          description: string
          id: string
          is_dismissed: boolean
          suggestion_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          description: string
          id?: string
          is_dismissed?: boolean
          suggestion_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          description?: string
          id?: string
          is_dismissed?: boolean
          suggestion_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          completion_tokens: number | null
          created_at: string | null
          estimated_cost: number | null
          function_name: string
          id: string
          model: string
          prompt_tokens: number | null
          total_tokens: number | null
          user_id: string
        }
        Insert: {
          completion_tokens?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          function_name: string
          id?: string
          model: string
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id: string
        }
        Update: {
          completion_tokens?: number | null
          created_at?: string | null
          estimated_cost?: number | null
          function_name?: string
          id?: string
          model?: string
          prompt_tokens?: number | null
          total_tokens?: number | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          id: string
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_confirmed: boolean
          client_confirmed_at: string | null
          client_id: string | null
          client_rescheduled_at: string | null
          contact_phone: string | null
          created_at: string
          deleted_at: string | null
          end_time: string
          final_price: number | null
          google_calendar_event_id: string | null
          id: string
          last_reminder_at: string | null
          notes: string | null
          operator_id: string
          package_id: string | null
          payment_method: string | null
          reminder_sent: boolean
          service_id: string
          short_code: string
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          client_confirmed?: boolean
          client_confirmed_at?: string | null
          client_id?: string | null
          client_rescheduled_at?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          end_time: string
          final_price?: number | null
          google_calendar_event_id?: string | null
          id?: string
          last_reminder_at?: string | null
          notes?: string | null
          operator_id: string
          package_id?: string | null
          payment_method?: string | null
          reminder_sent?: boolean
          service_id: string
          short_code: string
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          client_confirmed?: boolean
          client_confirmed_at?: string | null
          client_id?: string | null
          client_rescheduled_at?: string | null
          contact_phone?: string | null
          created_at?: string
          deleted_at?: string | null
          end_time?: string
          final_price?: number | null
          google_calendar_event_id?: string | null
          id?: string
          last_reminder_at?: string | null
          notes?: string | null
          operator_id?: string
          package_id?: string | null
          payment_method?: string | null
          reminder_sent?: boolean
          service_id?: string
          short_code?: string
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "client_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      balance_categories: {
        Row: {
          created_at: string
          entry_type: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_type: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_type?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      balance_entries: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          entry_date: string
          entry_type: string
          id: string
          reference_id: string | null
          source: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type: string
          id?: string
          reference_id?: string | null
          source?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          entry_date?: string
          entry_type?: string
          id?: string
          reference_id?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      call_center_agent_availability: {
        Row: {
          agent_id: string
          day_of_week: number
          dual_slot: boolean
          end_time: string
          end_time_2: string | null
          id: string
          is_active: boolean
          start_time: string
          start_time_2: string | null
        }
        Insert: {
          agent_id: string
          day_of_week: number
          dual_slot?: boolean
          end_time: string
          end_time_2?: string | null
          id?: string
          is_active?: boolean
          start_time: string
          start_time_2?: string | null
        }
        Update: {
          agent_id?: string
          day_of_week?: number
          dual_slot?: boolean
          end_time?: string
          end_time_2?: string | null
          id?: string
          is_active?: boolean
          start_time?: string
          start_time_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_center_agent_availability_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "call_center_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      call_center_agents: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          last_message_at: string | null
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          is_read: boolean
          message_type: Database["public"]["Enums"]["chat_message_type"]
          sender_id: string
          sender_type: Database["public"]["Enums"]["chat_sender_type"]
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: Database["public"]["Enums"]["chat_message_type"]
          sender_id: string
          sender_type: Database["public"]["Enums"]["chat_sender_type"]
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          is_read?: boolean
          message_type?: Database["public"]["Enums"]["chat_message_type"]
          sender_id?: string
          sender_type?: Database["public"]["Enums"]["chat_sender_type"]
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invites: {
        Row: {
          accepted_at: string | null
          client_id: string
          created_at: string
          expires_at: string | null
          id: string
          token: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          client_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          token?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          client_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_packages: {
        Row: {
          client_id: string
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          name: string
          price: number
          service_id: string | null
          status: string
          total_sessions: number
          updated_at: string
          used_sessions: number
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          name: string
          price?: number
          service_id?: string | null
          status?: string
          total_sessions?: number
          updated_at?: string
          used_sessions?: number
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          name?: string
          price?: number
          service_id?: string | null
          status?: string
          total_sessions?: number
          updated_at?: string
          used_sessions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_packages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          allergies: string | null
          auth_user_id: string | null
          birth_date: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          loyalty_level: string
          notes: string | null
          phone: string | null
          privacy_consent: boolean
          source: string | null
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          loyalty_level?: string
          notes?: string | null
          phone?: string | null
          privacy_consent?: boolean
          source?: string | null
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string | null
          auth_user_id?: string | null
          birth_date?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          loyalty_level?: string
          notes?: string | null
          phone?: string | null
          privacy_consent?: boolean
          source?: string | null
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_percent: number
          duration_months: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          target_user_id: string | null
          updated_at: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_percent: number
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          target_user_id?: string | null
          updated_at?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_percent?: number
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          target_user_id?: string | null
          updated_at?: string | null
          used_count?: number | null
        }
        Relationships: []
      }
      facebook_leads: {
        Row: {
          appointment_date: string | null
          assigned_agent_id: string | null
          call_attempts: number
          callback_agent_id: string | null
          callback_date: string | null
          created_at: string
          email: string | null
          facebook_page_id: string | null
          fb_form_id: string | null
          fb_lead_id: string
          fb_page_id: string | null
          full_name: string | null
          id: string
          last_called_at: string | null
          lead_data: Json
          next_reminder_at: string | null
          notes: string | null
          phone: string | null
          priority: string
          source: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_date?: string | null
          assigned_agent_id?: string | null
          call_attempts?: number
          callback_agent_id?: string | null
          callback_date?: string | null
          created_at?: string
          email?: string | null
          facebook_page_id?: string | null
          fb_form_id?: string | null
          fb_lead_id: string
          fb_page_id?: string | null
          full_name?: string | null
          id?: string
          last_called_at?: string | null
          lead_data?: Json
          next_reminder_at?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          source?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_date?: string | null
          assigned_agent_id?: string | null
          call_attempts?: number
          callback_agent_id?: string | null
          callback_date?: string | null
          created_at?: string
          email?: string | null
          facebook_page_id?: string | null
          fb_form_id?: string | null
          fb_lead_id?: string
          fb_page_id?: string | null
          full_name?: string | null
          id?: string
          last_called_at?: string | null
          lead_data?: Json
          next_reminder_at?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          source?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_leads_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "call_center_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_leads_callback_agent_id_fkey"
            columns: ["callback_agent_id"]
            isOneToOne: false
            referencedRelation: "call_center_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facebook_leads_facebook_page_id_fkey"
            columns: ["facebook_page_id"]
            isOneToOne: false
            referencedRelation: "facebook_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_pages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          page_access_token: string
          page_id: string
          page_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          page_access_token: string
          page_id: string
          page_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          page_access_token?: string
          page_id?: string
          page_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_enabled: boolean
          key: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          key: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean
          key?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      fiscal_receipts: {
        Row: {
          ade_response: string | null
          client_name: string | null
          client_vat_number: string | null
          created_at: string
          deleted_at: string | null
          id: string
          items: Json | null
          notes: string | null
          payment_method: string
          receipt_date: string
          receipt_number: string
          rt_closure_number: number | null
          rt_document_number: number | null
          rt_serial_number: string | null
          salon_address: string | null
          salon_name: string | null
          salon_vat_number: string | null
          sent_at: string | null
          sent_to_ade: boolean
          status: string
          subtotal: number
          total: number
          transaction_id: string | null
          updated_at: string
          user_id: string
          vat_amount: number
          vat_rate: number
          xml_content: string | null
        }
        Insert: {
          ade_response?: string | null
          client_name?: string | null
          client_vat_number?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payment_method?: string
          receipt_date?: string
          receipt_number: string
          rt_closure_number?: number | null
          rt_document_number?: number | null
          rt_serial_number?: string | null
          salon_address?: string | null
          salon_name?: string | null
          salon_vat_number?: string | null
          sent_at?: string | null
          sent_to_ade?: boolean
          status?: string
          subtotal?: number
          total?: number
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          vat_amount?: number
          vat_rate?: number
          xml_content?: string | null
        }
        Update: {
          ade_response?: string | null
          client_name?: string | null
          client_vat_number?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          payment_method?: string
          receipt_date?: string
          receipt_number?: string
          rt_closure_number?: number | null
          rt_document_number?: number | null
          rt_serial_number?: string | null
          salon_address?: string | null
          salon_name?: string | null
          salon_vat_number?: string | null
          sent_at?: string | null
          sent_to_ade?: boolean
          status?: string
          subtotal?: number
          total?: number
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          vat_amount?: number
          vat_rate?: number
          xml_content?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_receipts_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          created_at: string
          cta_action: string | null
          device_type: string | null
          event_type: string
          fb_lead_id: string | null
          id: string
          referrer: string | null
          screen_width: number | null
          session_id: string
          step_index: number
          step_name: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          cta_action?: string | null
          device_type?: string | null
          event_type?: string
          fb_lead_id?: string | null
          id?: string
          referrer?: string | null
          screen_width?: number | null
          session_id: string
          step_index: number
          step_name: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          cta_action?: string | null
          device_type?: string | null
          event_type?: string
          fb_lead_id?: string | null
          id?: string
          referrer?: string | null
          screen_width?: number | null
          session_id?: string
          step_index?: number
          step_name?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      gift_cards: {
        Row: {
          buyer_name: string | null
          code: string
          created_at: string
          deleted_at: string | null
          expires_at: string | null
          id: string
          initial_value: number
          recipient_name: string | null
          remaining_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_name?: string | null
          code: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          initial_value?: number
          recipient_name?: string | null
          remaining_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_name?: string | null
          code?: string
          created_at?: string
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          initial_value?: number
          recipient_name?: string | null
          remaining_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes: string | null
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          product_id: string
          quantity: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["inventory_movement_type"]
          notes?: string | null
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_call_logs: {
        Row: {
          agent_id: string
          called_at: string
          id: string
          lead_id: string
          notes: string | null
          outcome: string
        }
        Insert: {
          agent_id: string
          called_at?: string
          id?: string
          lead_id: string
          notes?: string | null
          outcome: string
        }
        Update: {
          agent_id?: string
          called_at?: string
          id?: string
          lead_id?: string
          notes?: string | null
          outcome?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_call_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "call_center_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_call_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "facebook_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_wa_automations: {
        Row: {
          condition_type: string
          created_at: string
          delay_minutes: number
          id: string
          is_active: boolean
          max_sends_per_lead: number
          name: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          condition_type: string
          created_at?: string
          delay_minutes?: number
          id?: string
          is_active?: boolean
          max_sends_per_lead?: number
          name: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          condition_type?: string
          created_at?: string
          delay_minutes?: number
          id?: string
          is_active?: boolean
          max_sends_per_lead?: number
          name?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_wa_automations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "lead_wa_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_wa_send_log: {
        Row: {
          automation_id: string | null
          created_at: string
          error_message: string | null
          id: string
          lead_id: string
          message_id: string | null
          phone: string
          sent_body: string
          status: string
          template_id: string | null
          via: string
        }
        Insert: {
          automation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id: string
          message_id?: string | null
          phone: string
          sent_body: string
          status?: string
          template_id?: string | null
          via?: string
        }
        Update: {
          automation_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lead_id?: string
          message_id?: string | null
          phone?: string
          sent_body?: string
          status?: string
          template_id?: string | null
          via?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_wa_send_log_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "lead_wa_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_wa_send_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "facebook_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_wa_send_log_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "lead_wa_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_wa_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          variables: string[]
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          variables?: string[]
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          variables?: string[]
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          description: string | null
          id: string
          points: number
          reason: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reason?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reason?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_reminder_config: {
        Row: {
          created_at: string
          id: string
          slots: Json
          sms_template: string
          sms_templates: Json | null
          updated_at: string
          user_id: string
          wa_template: string
          wa_templates: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          slots?: Json
          sms_template?: string
          sms_templates?: Json | null
          updated_at?: string
          user_id: string
          wa_template?: string
          wa_templates?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          slots?: Json
          sms_template?: string
          sms_templates?: Json | null
          updated_at?: string
          user_id?: string
          wa_template?: string
          wa_templates?: Json | null
        }
        Relationships: []
      }
      manual_reminder_logs: {
        Row: {
          appointment_id: string
          channel: string
          id: string
          salon_user_id: string
          sent_at: string
          slot_key: string
        }
        Insert: {
          appointment_id: string
          channel: string
          id?: string
          salon_user_id: string
          sent_at?: string
          slot_key: string
        }
        Update: {
          appointment_id?: string
          channel?: string
          id?: string
          salon_user_id?: string
          sent_at?: string
          slot_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "manual_reminder_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_subscriptions: {
        Row: {
          created_at: string
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messaging_usage_log: {
        Row: {
          channel: string
          created_at: string | null
          flow_node_id: string | null
          id: string
          is_new_contact: boolean | null
          message_sid: string | null
          recipient_phone: string
          reported_to_stripe: boolean | null
          salon_user_id: string
          unit_price: number
        }
        Insert: {
          channel: string
          created_at?: string | null
          flow_node_id?: string | null
          id?: string
          is_new_contact?: boolean | null
          message_sid?: string | null
          recipient_phone: string
          reported_to_stripe?: boolean | null
          salon_user_id: string
          unit_price?: number
        }
        Update: {
          channel?: string
          created_at?: string | null
          flow_node_id?: string | null
          id?: string
          is_new_contact?: boolean | null
          message_sid?: string | null
          recipient_phone?: string
          reported_to_stripe?: boolean | null
          salon_user_id?: string
          unit_price?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          salon_user_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          salon_user_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          salon_user_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      operator_attendance: {
        Row: {
          break_minutes: number
          clock_in: string | null
          clock_out: string | null
          created_at: string
          date: string
          id: string
          notes: string | null
          operator_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          break_minutes?: number
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          operator_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          break_minutes?: number
          clock_in?: string | null
          clock_out?: string | null
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          operator_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_attendance_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_goals: {
        Row: {
          actual_appointments: number
          actual_revenue: number
          created_at: string
          id: string
          month: number
          operator_id: string
          target_appointments: number
          target_revenue: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          actual_appointments?: number
          actual_revenue?: number
          created_at?: string
          id?: string
          month: number
          operator_id: string
          target_appointments?: number
          target_revenue?: number
          updated_at?: string
          user_id: string
          year: number
        }
        Update: {
          actual_appointments?: number
          actual_revenue?: number
          created_at?: string
          id?: string
          month?: number
          operator_id?: string
          target_appointments?: number
          target_revenue?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "operator_goals_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          operator_id: string
          token: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          operator_id: string
          token?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          operator_id?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_invites_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_shifts: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          operator_id: string
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          operator_id: string
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          operator_id?: string
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_shifts_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          agenda_position: number
          auth_user_id: string | null
          calendar_color: string
          calendar_visible: boolean
          commission_product_pct: number
          commission_service_pct: number
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          monthly_target: number
          name: string
          photo_url: string | null
          portal_permissions: Json
          role: string | null
          service_ids: string[] | null
          specializations: string[] | null
          updated_at: string
          user_id: string
          working_hours: Json | null
        }
        Insert: {
          agenda_position?: number
          auth_user_id?: string | null
          calendar_color?: string
          calendar_visible?: boolean
          commission_product_pct?: number
          commission_service_pct?: number
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          monthly_target?: number
          name: string
          photo_url?: string | null
          portal_permissions?: Json
          role?: string | null
          service_ids?: string[] | null
          specializations?: string[] | null
          updated_at?: string
          user_id: string
          working_hours?: Json | null
        }
        Update: {
          agenda_position?: number
          auth_user_id?: string | null
          calendar_color?: string
          calendar_visible?: boolean
          commission_product_pct?: number
          commission_service_pct?: number
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          monthly_target?: number
          name?: string
          photo_url?: string | null
          portal_permissions?: Json
          role?: string | null
          service_ids?: string[] | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string
          working_hours?: Json | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          max_appointments: number | null
          max_clients: number | null
          max_operators: number
          name: string
          price_monthly: number
          price_yearly: number | null
          slug: string
          sort_order: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_appointments?: number | null
          max_clients?: number | null
          max_operators?: number
          name: string
          price_monthly?: number
          price_yearly?: number | null
          slug: string
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          max_appointments?: number | null
          max_clients?: number | null
          max_operators?: number
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          slug?: string
          sort_order?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          emoji: string | null
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          cost_price: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          min_quantity: number
          name: string
          notes: string | null
          product_type: string
          quantity: number
          sale_price: number
          supplier: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          min_quantity?: number
          name: string
          notes?: string | null
          product_type?: string
          quantity?: number
          sale_price?: number
          supplier?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          cost_price?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          min_quantity?: number
          name?: string
          notes?: string | null
          product_type?: string
          quantity?: number
          sale_price?: number
          supplier?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          address: string | null
          avatar_url: string | null
          booking_blocked_from: string | null
          booking_blocked_message: string | null
          booking_blocked_until: string | null
          booking_enabled: boolean
          booking_slug: string | null
          business_category: string[] | null
          created_at: string
          current_software: string | null
          deleted_at: string | null
          display_name: string | null
          email: string | null
          id: string
          loyalty_enabled: boolean
          notification_prefs: Json | null
          onboarding_phase: number
          opening_hours: Json | null
          other_category_text: string | null
          phone: string | null
          referral_other_text: string | null
          referral_source: string | null
          salon_name: string | null
          service_locations: string[] | null
          status: string
          team_size: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          account_type?: string | null
          address?: string | null
          avatar_url?: string | null
          booking_blocked_from?: string | null
          booking_blocked_message?: string | null
          booking_blocked_until?: string | null
          booking_enabled?: boolean
          booking_slug?: string | null
          business_category?: string[] | null
          created_at?: string
          current_software?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          loyalty_enabled?: boolean
          notification_prefs?: Json | null
          onboarding_phase?: number
          opening_hours?: Json | null
          other_category_text?: string | null
          phone?: string | null
          referral_other_text?: string | null
          referral_source?: string | null
          salon_name?: string | null
          service_locations?: string[] | null
          status?: string
          team_size?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          account_type?: string | null
          address?: string | null
          avatar_url?: string | null
          booking_blocked_from?: string | null
          booking_blocked_message?: string | null
          booking_blocked_until?: string | null
          booking_enabled?: boolean
          booking_slug?: string | null
          business_category?: string[] | null
          created_at?: string
          current_software?: string | null
          deleted_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          loyalty_enabled?: boolean
          notification_prefs?: Json | null
          onboarding_phase?: number
          opening_hours?: Json | null
          other_category_text?: string | null
          phone?: string | null
          referral_other_text?: string | null
          referral_source?: string | null
          salon_name?: string | null
          service_locations?: string[] | null
          status?: string
          team_size?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reminder_flow_layouts: {
        Row: {
          anchor_data: Json
          created_at: string
          id: string
          layout_data: Json
          model_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anchor_data?: Json
          created_at?: string
          id?: string
          layout_data?: Json
          model_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anchor_data?: Json
          created_at?: string
          id?: string
          layout_data?: Json
          model_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_flow_layouts_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "reminder_flow_models"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_flow_models: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          flow_config: Json
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          flow_config?: Json
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          flow_config?: Json
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      reminder_flow_nodes: {
        Row: {
          admin_notified_at: string | null
          client_acted: boolean
          created_at: string
          flow_id: string
          id: string
          message_key: string | null
          message_variant: string | null
          node_type: string
          only_if_confirmed: boolean
          only_if_no_response: boolean
          push_delivered_at: string | null
          push_sent_at: string | null
          scheduled_at: string
          sms_delivered_at: string | null
          sms_message_sid: string | null
          sms_sent_at: string | null
          status: string
          whatsapp_delivered_at: string | null
          whatsapp_message_sid: string | null
          whatsapp_sent_at: string | null
        }
        Insert: {
          admin_notified_at?: string | null
          client_acted?: boolean
          created_at?: string
          flow_id: string
          id?: string
          message_key?: string | null
          message_variant?: string | null
          node_type: string
          only_if_confirmed?: boolean
          only_if_no_response?: boolean
          push_delivered_at?: string | null
          push_sent_at?: string | null
          scheduled_at: string
          sms_delivered_at?: string | null
          sms_message_sid?: string | null
          sms_sent_at?: string | null
          status?: string
          whatsapp_delivered_at?: string | null
          whatsapp_message_sid?: string | null
          whatsapp_sent_at?: string | null
        }
        Update: {
          admin_notified_at?: string | null
          client_acted?: boolean
          created_at?: string
          flow_id?: string
          id?: string
          message_key?: string | null
          message_variant?: string | null
          node_type?: string
          only_if_confirmed?: boolean
          only_if_no_response?: boolean
          push_delivered_at?: string | null
          push_sent_at?: string | null
          scheduled_at?: string
          sms_delivered_at?: string | null
          sms_message_sid?: string | null
          sms_sent_at?: string | null
          status?: string
          whatsapp_delivered_at?: string | null
          whatsapp_message_sid?: string | null
          whatsapp_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_flow_nodes_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "reminder_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_flows: {
        Row: {
          action_token: string
          appointment_id: string
          client_action: string | null
          client_action_at: string | null
          client_id: string
          created_at: string
          flow_case: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_token?: string
          appointment_id: string
          client_action?: string | null
          client_action_at?: string | null
          client_id: string
          created_at?: string
          flow_case: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_token?: string
          appointment_id?: string
          client_action?: string | null
          client_action_at?: string | null
          client_id?: string
          created_at?: string
          flow_case?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_flows_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_rules: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          offset_minutes: number
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          offset_minutes: number
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          offset_minutes?: number
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      salon_integrations: {
        Row: {
          baileys_api_key: string | null
          baileys_service_url: string | null
          created_at: string
          fast_flow_mode: boolean
          id: string
          sender_id_enabled: boolean
          sms_enabled: boolean
          test_mode: boolean
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_messaging_service_sid: string | null
          twilio_phone_number: string | null
          twilio_sender_id: string | null
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
          whatsapp_phone_id: string | null
          whatsapp_phone_number: string | null
          whatsapp_token: string | null
          whatsapp_verify_token: string | null
        }
        Insert: {
          baileys_api_key?: string | null
          baileys_service_url?: string | null
          created_at?: string
          fast_flow_mode?: boolean
          id?: string
          sender_id_enabled?: boolean
          sms_enabled?: boolean
          test_mode?: boolean
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_messaging_service_sid?: string | null
          twilio_phone_number?: string | null
          twilio_sender_id?: string | null
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
          whatsapp_phone_id?: string | null
          whatsapp_phone_number?: string | null
          whatsapp_token?: string | null
          whatsapp_verify_token?: string | null
        }
        Update: {
          baileys_api_key?: string | null
          baileys_service_url?: string | null
          created_at?: string
          fast_flow_mode?: boolean
          id?: string
          sender_id_enabled?: boolean
          sms_enabled?: boolean
          test_mode?: boolean
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_messaging_service_sid?: string | null
          twilio_phone_number?: string | null
          twilio_sender_id?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
          whatsapp_phone_id?: string | null
          whatsapp_phone_number?: string | null
          whatsapp_token?: string | null
          whatsapp_verify_token?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          deleted_at: string | null
          emoji: string | null
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          emoji?: string | null
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      service_products: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity_used: number
          service_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity_used?: number
          service_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity_used?: number
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_products_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_package: boolean
          name: string
          package_price: number | null
          package_sessions: number | null
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes: number
          id?: string
          is_package?: boolean
          name: string
          package_price?: number | null
          package_sessions?: number | null
          price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_package?: boolean
          name?: string
          package_price?: number | null
          package_sessions?: number | null
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          delivery_method: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_method: string | null
          shipping_address: Json | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_method?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          payment_method?: string | null
          shipping_address?: Json | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_method?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          shipping_address?: Json | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shop_settings: {
        Row: {
          accent_color: string | null
          banner_sections: Json | null
          created_at: string
          footer_about: string | null
          footer_links: Json | null
          footer_text: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          is_published: boolean
          logo_url: string | null
          navigation_menu: Json | null
          paypal_client_id: string | null
          primary_color: string | null
          shipping_info: Json | null
          shop_name: string | null
          social_links: Json | null
          stripe_secret_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          banner_sections?: Json | null
          created_at?: string
          footer_about?: string | null
          footer_links?: Json | null
          footer_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          navigation_menu?: Json | null
          paypal_client_id?: string | null
          primary_color?: string | null
          shipping_info?: Json | null
          shop_name?: string | null
          social_links?: Json | null
          stripe_secret_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          banner_sections?: Json | null
          created_at?: string
          footer_about?: string | null
          footer_links?: Json | null
          footer_text?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          is_published?: boolean
          logo_url?: string | null
          navigation_menu?: Json | null
          paypal_client_id?: string | null
          primary_color?: string | null
          shipping_info?: Json | null
          shop_name?: string | null
          social_links?: Json | null
          stripe_secret_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sms_delivery_log: {
        Row: {
          created_at: string
          delivered_at: string | null
          failed_at: string | null
          id: string
          message_body: string
          message_sid: string | null
          order_id: string | null
          phone: string
          salon_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          id?: string
          message_body: string
          message_sid?: string | null
          order_id?: string | null
          phone: string
          salon_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          failed_at?: string | null
          id?: string
          message_body?: string
          message_sid?: string | null
          order_id?: string | null
          phone?: string
          salon_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_delivery_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_period: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          deleted_at: string | null
          id: string
          is_trial: boolean
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          deleted_at?: string | null
          id?: string
          is_trial?: boolean
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          deleted_at?: string | null
          id?: string
          is_trial?: boolean
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          retailer_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          retailer_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          retailer_user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
          sender_type: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          appointment_id: string | null
          client_id: string | null
          created_at: string
          deleted_at: string | null
          discount_amount: number
          discount_percent: number
          id: string
          items: Json
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["transaction_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount_amount?: number
          discount_percent?: number
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount_amount?: number
          discount_percent?: number
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_cards: {
        Row: {
          client_id: string
          completed_cycles: number
          created_at: string
          discount_pct: number
          id: string
          is_active: boolean
          reward_service_id: string | null
          reward_type: string
          stamps_count: number
          threshold: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          completed_cycles?: number
          created_at?: string
          discount_pct?: number
          id?: string
          is_active?: boolean
          reward_service_id?: string | null
          reward_type?: string
          stamps_count?: number
          threshold?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          completed_cycles?: number
          created_at?: string
          discount_pct?: number
          id?: string
          is_active?: boolean
          reward_service_id?: string | null
          reward_type?: string
          stamps_count?: number
          threshold?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_cards_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_cards_reward_service_id_fkey"
            columns: ["reward_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      treatment_photos: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          deleted_at: string | null
          gdpr_consent: boolean
          id: string
          notes: string | null
          photo_type: string
          photo_url: string
          taken_at: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          deleted_at?: string | null
          gdpr_consent?: boolean
          id?: string
          notes?: string | null
          photo_type?: string
          photo_url: string
          taken_at?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          gdpr_consent?: boolean
          id?: string
          notes?: string | null
          photo_type?: string
          photo_url?: string
          taken_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatment_photos_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatment_photos_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_categories: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          sort_order: number
          status: string
          topics: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          status?: string
          topics?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          status?: string
          topics?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tutorial_videos: {
        Row: {
          category_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          menu_section: string | null
          sort_order: number
          status: string
          title: string
          updated_at: string
          vimeo_embed_url: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          menu_section?: string | null
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          vimeo_embed_url: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          menu_section?: string | null
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          vimeo_embed_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "tutorial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      unconfirmed_appointments: {
        Row: {
          appointment_id: string
          escalated_at: string
          id: string
          resolution: string | null
          resolved: boolean
          resolved_at: string | null
          user_id: string
        }
        Insert: {
          appointment_id: string
          escalated_at?: string
          id?: string
          resolution?: string | null
          resolved?: boolean
          resolved_at?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string
          escalated_at?: string
          id?: string
          resolution?: string | null
          resolved?: boolean
          resolved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unconfirmed_appointments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
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
      wa_message_queue: {
        Row: {
          attempts: number
          body: string
          created_at: string
          error_message: string | null
          flow_node_id: string | null
          id: string
          processed_at: string | null
          recipient_phone: string
          salon_user_id: string
          scheduled_for: string
          status: string
        }
        Insert: {
          attempts?: number
          body: string
          created_at?: string
          error_message?: string | null
          flow_node_id?: string | null
          id?: string
          processed_at?: string | null
          recipient_phone: string
          salon_user_id: string
          scheduled_for?: string
          status?: string
        }
        Update: {
          attempts?: number
          body?: string
          created_at?: string
          error_message?: string | null
          flow_node_id?: string | null
          id?: string
          processed_at?: string | null
          recipient_phone?: string
          salon_user_id?: string
          scheduled_for?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_affiliate_invite: {
        Args: { p_auth_user_id: string; p_token: string }
        Returns: Json
      }
      accept_client_invite: {
        Args: { p_auth_user_id: string; p_token: string }
        Returns: Json
      }
      accept_operator_invite: {
        Args: { p_auth_user_id: string; p_token: string }
        Returns: Json
      }
      can_access_conversation: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_support_conversation: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
      generate_order_number: { Args: { p_user_id: string }; Returns: string }
      generate_receipt_number: { Args: { p_user_id: string }; Returns: string }
      generate_short_code: { Args: { len?: number }; Returns: string }
      get_affiliate_id_for_auth_user: {
        Args: { _auth_user_id: string }
        Returns: string
      }
      get_affiliate_manager_id: {
        Args: { _auth_user_id: string }
        Returns: string
      }
      get_integration_secrets: {
        Args: { p_integration_user_id: string }
        Returns: Json
      }
      get_integration_secrets_status: {
        Args: { p_user_id: string }
        Returns: Json
      }
      get_operator_id_for_auth_user: {
        Args: { _auth_user_id: string }
        Returns: string
      }
      get_operator_salon_user_id: {
        Args: { _auth_user_id: string }
        Returns: string
      }
      get_payment_keys_status: { Args: { p_user_id: string }; Returns: Json }
      get_public_operators_for_client: {
        Args: { p_salon_user_id: string }
        Returns: Json[]
      }
      get_public_plans: { Args: never; Returns: Json[] }
      get_public_profile_for_booking: {
        Args: { p_booking_slug: string }
        Returns: Json
      }
      get_public_shop_products: { Args: { p_user_id: string }; Returns: Json[] }
      get_public_shop_settings: { Args: never; Returns: Json[] }
      get_stripe_platform_keys_status: { Args: never; Returns: Json }
      get_team_member_ids: {
        Args: { _manager_auth_user_id: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_super_admin_role: { Args: { _user_id: string }; Returns: boolean }
      is_affiliate: { Args: { _user_id: string }; Returns: boolean }
      is_affiliate_manager: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "user"
        | "admin"
        | "moderator"
        | "super_admin"
        | "owner"
        | "manager"
        | "operator"
        | "receptionist"
        | "client"
        | "affiliate"
        | "affiliate_manager"
      appointment_status:
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      chat_message_type: "text" | "image" | "audio" | "file"
      chat_sender_type: "salon" | "client"
      inventory_movement_type:
        | "load"
        | "unload"
        | "sale"
        | "internal_use"
        | "adjustment"
      payment_method: "cash" | "card" | "bank_transfer" | "gift_card"
      transaction_status: "completed" | "refunded" | "voided"
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
        "user",
        "admin",
        "moderator",
        "super_admin",
        "owner",
        "manager",
        "operator",
        "receptionist",
        "client",
        "affiliate",
        "affiliate_manager",
      ],
      appointment_status: [
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      chat_message_type: ["text", "image", "audio", "file"],
      chat_sender_type: ["salon", "client"],
      inventory_movement_type: [
        "load",
        "unload",
        "sale",
        "internal_use",
        "adjustment",
      ],
      payment_method: ["cash", "card", "bank_transfer", "gift_card"],
      transaction_status: ["completed", "refunded", "voided"],
    },
  },
} as const
