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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          hub_id: number
          id: string
          is_acknowledged: boolean
          level: Database["public"]["Enums"]["alert_level"]
          machine_id: string | null
          message: string
          type: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          hub_id: number
          id?: string
          is_acknowledged?: boolean
          level?: Database["public"]["Enums"]["alert_level"]
          machine_id?: string | null
          message: string
          type: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          hub_id?: number
          id?: string
          is_acknowledged?: boolean
          level?: Database["public"]["Enums"]["alert_level"]
          machine_id?: string | null
          message?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_acknowledged_by_fkey"
            columns: ["acknowledged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_email: string
          actor_id: string | null
          created_at: string
          detail: string | null
          entity: string
          entity_ref: string | null
          hub_id: number | null
          id: string
        }
        Insert: {
          action: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          detail?: string | null
          entity: string
          entity_ref?: string | null
          hub_id?: number | null
          id?: string
        }
        Update: {
          action?: string
          actor_email?: string
          actor_id?: string | null
          created_at?: string
          detail?: string | null
          entity?: string
          entity_ref?: string | null
          hub_id?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          assigned_to: string | null
          created_at: string
          hub_id: number | null
          id: string
          installed_at: string | null
          kind: Database["public"]["Enums"]["device_kind"]
          last_checkin: string | null
          machine_id: string | null
          model: string
          notes: string | null
          serial: string
          sim_number: string | null
          status: Database["public"]["Enums"]["device_status"]
          updated_at: string
          warranty_end: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          hub_id?: number | null
          id?: string
          installed_at?: string | null
          kind: Database["public"]["Enums"]["device_kind"]
          last_checkin?: string | null
          machine_id?: string | null
          model?: string
          notes?: string | null
          serial: string
          sim_number?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
          warranty_end?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          hub_id?: number | null
          id?: string
          installed_at?: string | null
          kind?: Database["public"]["Enums"]["device_kind"]
          last_checkin?: string | null
          machine_id?: string | null
          model?: string
          notes?: string | null
          serial?: string
          sim_number?: string | null
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
          warranty_end?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          cost_usd: number
          flag_reason: string | null
          fuel_level_after: number | null
          fuel_level_before: number | null
          hub_id: number
          id: string
          is_flagged: boolean
          location_lat: number | null
          location_lng: number | null
          logged_at: string
          machine_id: string
          notes: string | null
          operator_id: string | null
          volume_litres: number
        }
        Insert: {
          cost_usd?: number
          flag_reason?: string | null
          fuel_level_after?: number | null
          fuel_level_before?: number | null
          hub_id: number
          id?: string
          is_flagged?: boolean
          location_lat?: number | null
          location_lng?: number | null
          logged_at?: string
          machine_id: string
          notes?: string | null
          operator_id?: string | null
          volume_litres: number
        }
        Update: {
          cost_usd?: number
          flag_reason?: string | null
          fuel_level_after?: number | null
          fuel_level_before?: number | null
          hub_id?: number
          id?: string
          is_flagged?: boolean
          location_lat?: number | null
          location_lng?: number | null
          logged_at?: string
          machine_id?: string
          notes?: string | null
          operator_id?: string | null
          volume_litres?: number
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          alert_on_entry: boolean
          alert_on_exit: boolean
          created_at: string
          created_by: string | null
          hub_id: number
          id: string
          is_active: boolean
          machine_id: string | null
          name: string
          polygon_json: Json
        }
        Insert: {
          alert_on_entry?: boolean
          alert_on_exit?: boolean
          created_at?: string
          created_by?: string | null
          hub_id: number
          id?: string
          is_active?: boolean
          machine_id?: string | null
          name: string
          polygon_json?: Json
        }
        Update: {
          alert_on_entry?: boolean
          alert_on_exit?: boolean
          created_at?: string
          created_by?: string | null
          hub_id?: number
          id?: string
          is_active?: boolean
          machine_id?: string | null
          name?: string
          polygon_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "geofences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofences_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "geofences_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_tracks: {
        Row: {
          engine_on: boolean
          fuel_level: number | null
          id: string
          lat: number
          lng: number
          machine_id: string
          recorded_at: string
          speed_kmh: number
        }
        Insert: {
          engine_on?: boolean
          fuel_level?: number | null
          id?: string
          lat: number
          lng: number
          machine_id: string
          recorded_at?: string
          speed_kmh?: number
        }
        Update: {
          engine_on?: boolean
          fuel_level?: number | null
          id?: string
          lat?: number
          lng?: number
          machine_id?: string
          recorded_at?: string
          speed_kmh?: number
        }
        Relationships: [
          {
            foreignKeyName: "gps_tracks_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          county: string
          created_at: string
          id: number
          lat_center: number
          lng_center: number
          machine_count: number
          name: string
          supervisor_id: string | null
        }
        Insert: {
          county: string
          created_at?: string
          id: number
          lat_center: number
          lng_center: number
          machine_count?: number
          name: string
          supervisor_id?: string | null
        }
        Update: {
          county?: string
          created_at?: string
          id?: number
          lat_center?: number
          lng_center?: number
          machine_count?: number
          name?: string
          supervisor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hubs_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          checklist_json: Json
          hub_id: number
          id: string
          machine_id: string
          notes: string | null
          operator_id: string | null
          overall_status: string
          photo_urls: string[]
          submitted_at: string
          type: string
        }
        Insert: {
          checklist_json?: Json
          hub_id: number
          id?: string
          machine_id: string
          notes?: string | null
          operator_id?: string | null
          overall_status?: string
          photo_urls?: string[]
          submitted_at?: string
          type?: string
        }
        Update: {
          checklist_json?: Json
          hub_id?: number
          id?: string
          machine_id?: string
          notes?: string | null
          operator_id?: string | null
          overall_status?: string
          photo_urls?: string[]
          submitted_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspections_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      machine_project_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          machine_id: string
          project_id: string
          unassigned_at: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          machine_id: string
          project_id: string
          unassigned_at?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          machine_id?: string
          project_id?: string
          unassigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "machine_project_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_project_assignments_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machine_project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          created_at: string
          current_project_id: string | null
          engine_hours_lifetime: number
          engine_hours_today: number
          fuel_level: number
          hub_id: number
          id: string
          ignition_on: boolean
          last_seen: string
          lat: number | null
          lng: number | null
          operator_id: string | null
          speed_kmh: number
          status: Database["public"]["Enums"]["machine_status"]
          type: Database["public"]["Enums"]["machine_type"]
          unit_id: string
        }
        Insert: {
          created_at?: string
          current_project_id?: string | null
          engine_hours_lifetime?: number
          engine_hours_today?: number
          fuel_level?: number
          hub_id: number
          id?: string
          ignition_on?: boolean
          last_seen?: string
          lat?: number | null
          lng?: number | null
          operator_id?: string | null
          speed_kmh?: number
          status?: Database["public"]["Enums"]["machine_status"]
          type: Database["public"]["Enums"]["machine_type"]
          unit_id: string
        }
        Update: {
          created_at?: string
          current_project_id?: string | null
          engine_hours_lifetime?: number
          engine_hours_today?: number
          fuel_level?: number
          hub_id?: number
          id?: string
          ignition_on?: boolean
          last_seen?: string
          lat?: number | null
          lng?: number | null
          operator_id?: string | null
          speed_kmh?: number
          status?: Database["public"]["Enums"]["machine_status"]
          type?: Database["public"]["Enums"]["machine_type"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "machines_current_project_id_fkey"
            columns: ["current_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "machines_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          completed_at: string | null
          cost_usd: number | null
          description: string | null
          hub_id: number
          id: string
          labour_hours: number | null
          machine_id: string
          notes: string | null
          parts_used: string | null
          scheduled_at: string
          status: string
          technician_name: string | null
          type: string
        }
        Insert: {
          completed_at?: string | null
          cost_usd?: number | null
          description?: string | null
          hub_id: number
          id?: string
          labour_hours?: number | null
          machine_id: string
          notes?: string | null
          parts_used?: string | null
          scheduled_at?: string
          status?: string
          technician_name?: string | null
          type?: string
        }
        Update: {
          completed_at?: string | null
          cost_usd?: number | null
          description?: string | null
          hub_id?: number
          id?: string
          labour_hours?: number | null
          machine_id?: string
          notes?: string | null
          parts_used?: string | null
          scheduled_at?: string
          status?: string
          technician_name?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_records_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          hub_id: number | null
          id: string
          is_active: boolean
          last_login: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          hub_id?: number | null
          id: string
          is_active?: boolean
          last_login?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          hub_id?: number | null
          id?: string
          is_active?: boolean
          last_login?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_hub_fk"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          deadline: string | null
          description: string | null
          hub_id: number
          id: string
          km_coverage: number
          machines_assigned: number
          name: string
          progress_pct: number
          status: Database["public"]["Enums"]["project_status"]
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          hub_id: number
          id?: string
          km_coverage?: number
          machines_assigned?: number
          name: string
          progress_pct?: number
          status?: Database["public"]["Enums"]["project_status"]
        }
        Update: {
          created_at?: string
          deadline?: string | null
          description?: string | null
          hub_id?: number
          id?: string
          km_coverage?: number
          machines_assigned?: number
          name?: string
          progress_pct?: number
          status?: Database["public"]["Enums"]["project_status"]
        }
        Relationships: [
          {
            foreignKeyName: "projects_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          data_json: Json
          generated_at: string
          generated_by: string | null
          hub_id: number | null
          id: string
          pdf_url: string | null
          period_end: string | null
          period_start: string | null
          type: string
        }
        Insert: {
          data_json?: Json
          generated_at?: string
          generated_by?: string | null
          hub_id?: number | null
          id?: string
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          type: string
        }
        Update: {
          data_json?: Json
          generated_at?: string
          generated_by?: string | null
          hub_id?: number | null
          id?: string
          pdf_url?: string | null
          period_end?: string | null
          period_start?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
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
      work_orders: {
        Row: {
          completed_at: string | null
          completion_notes: string | null
          created_at: string
          created_by: string | null
          description: string | null
          hub_id: number
          id: string
          machine_id: string | null
          operator_id: string | null
          priority: Database["public"]["Enums"]["wo_priority"]
          project_id: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["wo_status"]
          title: string
        }
        Insert: {
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hub_id: number
          id?: string
          machine_id?: string | null
          operator_id?: string | null
          priority?: Database["public"]["Enums"]["wo_priority"]
          project_id?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["wo_status"]
          title: string
        }
        Update: {
          completed_at?: string | null
          completion_notes?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hub_id?: number
          id?: string
          machine_id?: string | null
          operator_id?: string | null
          priority?: Database["public"]["Enums"]["wo_priority"]
          project_id?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["wo_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_all: { Args: never; Returns: boolean }
      can_read_hub: { Args: { _hub_id: number }; Returns: boolean }
      can_write_hub: { Args: { _hub_id: number }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_hq: { Args: never; Returns: boolean }
      my_hub_id: { Args: never; Returns: number }
      my_role: { Args: never; Returns: Database["public"]["Enums"]["app_role"] }
    }
    Enums: {
      alert_level: "critical" | "warning" | "info"
      app_role:
        | "hq_admin"
        | "hub_supervisor"
        | "field_operator"
        | "ministry_analyst"
      device_kind: "tracker" | "monitor" | "tablet"
      device_status: "active" | "faulty" | "spare" | "retired"
      machine_status: "active" | "idle" | "maintenance" | "alert" | "offline"
      machine_type:
        | "motor_grader"
        | "front_end_loader"
        | "excavator"
        | "dump_truck"
        | "compactor"
        | "other"
      project_status: "active" | "delayed" | "critical" | "complete"
      wo_priority: "low" | "medium" | "high"
      wo_status: "assigned" | "in_progress" | "completed" | "cancelled"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      alert_level: ["critical", "warning", "info"],
      app_role: [
        "hq_admin",
        "hub_supervisor",
        "field_operator",
        "ministry_analyst",
      ],
      device_kind: ["tracker", "monitor", "tablet"],
      device_status: ["active", "faulty", "spare", "retired"],
      machine_status: ["active", "idle", "maintenance", "alert", "offline"],
      machine_type: [
        "motor_grader",
        "front_end_loader",
        "excavator",
        "dump_truck",
        "compactor",
        "other",
      ],
      project_status: ["active", "delayed", "critical", "complete"],
      wo_priority: ["low", "medium", "high"],
      wo_status: ["assigned", "in_progress", "completed", "cancelled"],
    },
  },
} as const
