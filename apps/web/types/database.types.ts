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
      _migrations: {
        Row: {
          applied_at: string
          filename: string
          id: number
        }
        Insert: {
          applied_at?: string
          filename: string
          id?: number
        }
        Update: {
          applied_at?: string
          filename?: string
          id?: number
        }
        Relationships: []
      }
      agents: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          role?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          created_at: string
          id: string
          name: string
          phone_number: string | null
          provider_instance_id: string
          provider_token: string
          status: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          phone_number?: string | null
          provider_instance_id: string
          provider_token: string
          status?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          phone_number?: string | null
          provider_instance_id?: string
          provider_token?: string
          status?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          id: string
          metadata: Json
          name: string | null
          phone: string
          tenant_id: string
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string | null
          phone: string
          tenant_id: string
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json
          name?: string | null
          phone?: string
          tenant_id?: string
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_id: string | null
          channel: string
          channel_id: string | null
          contact_id: string
          created_at: string
          crm_stage: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          metadata: Json
          opened_at: string
          resolved_at: string | null
          status: string
          tenant_id: string | null
          unread_count: number | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          agent_id?: string | null
          channel?: string
          channel_id?: string | null
          contact_id: string
          created_at?: string
          crm_stage?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          opened_at?: string
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
          unread_count?: number | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          agent_id?: string | null
          channel?: string
          channel_id?: string | null
          contact_id?: string
          created_at?: string
          crm_stage?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          metadata?: Json
          opened_at?: string
          resolved_at?: string | null
          status?: string
          tenant_id?: string | null
          unread_count?: number | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          content: string | null
          conversation_id: string
          created_at: string
          direction: string
          id: string
          media_url: string | null
          metadata: Json
          sender_name: string | null
          sent_at: string
          status: string
          tenant_id: string | null
          type: string
          wa_message_id: string | null
        }
        Insert: {
          body?: string | null
          content?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          media_url?: string | null
          metadata?: Json
          sender_name?: string | null
          sent_at?: string
          status?: string
          tenant_id?: string | null
          type?: string
          wa_message_id?: string | null
        }
        Update: {
          body?: string | null
          content?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          media_url?: string | null
          metadata?: Json
          sender_name?: string | null
          sent_at?: string
          status?: string
          tenant_id?: string | null
          type?: string
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          plan: string
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          plan?: string
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          plan?: string
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_workspaces: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_workspaces_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_workspaces_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      "whatsapp-crm-saas": {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          plan: string | null
          subscription_status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: string | null
          subscription_status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          plan?: string | null
          subscription_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_tenant_id: { Args: never; Returns: string }
      set_tenant_context: { Args: { p_tenant_id: string }; Returns: undefined }
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
