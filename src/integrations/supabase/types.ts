// Supabase types — managed by Lovable. Regenerates when schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.1" };
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; name: string; avatar_url: string | null; created_at: string; updated_at: string; };
        Insert: { id: string; email: string; name?: string; avatar_url?: string | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; email?: string; name?: string; avatar_url?: string | null; created_at?: string; updated_at?: string; };
        Relationships: [{ foreignKeyName: "profiles_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"]; }];
      };
      user_roles: {
        Row: { id: string; user_id: string; role: Database["public"]["Enums"]["app_role"]; institution_id: string | null; campus_id: string | null; created_at: string; };
        Insert: { id?: string; user_id: string; role: Database["public"]["Enums"]["app_role"]; institution_id?: string | null; campus_id?: string | null; created_at?: string; };
        Update: { id?: string; user_id?: string; role?: Database["public"]["Enums"]["app_role"]; institution_id?: string | null; campus_id?: string | null; created_at?: string; };
        Relationships: [{ foreignKeyName: "user_roles_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"]; }];
      };
      institutions: {
        Row: { id: string; name: string; type: Database["public"]["Enums"]["institution_type"]; city: string; address: string | null; description: string | null; image_url: string | null; rating: number | null; lat: number | null; lng: number | null; contact_email: string | null; contact_phone: string | null; amenities: string[] | null; created_by: string | null; created_at: string; updated_at: string; };
        Insert: { id?: string; name: string; type: Database["public"]["Enums"]["institution_type"]; city?: string; address?: string | null; description?: string | null; image_url?: string | null; rating?: number | null; lat?: number | null; lng?: number | null; contact_email?: string | null; contact_phone?: string | null; amenities?: string[] | null; created_by?: string | null; created_at?: string; updated_at?: string; };
        Update: { id?: string; name?: string; type?: Database["public"]["Enums"]["institution_type"]; city?: string; address?: string | null; description?: string | null; image_url?: string | null; rating?: number | null; lat?: number | null; lng?: number | null; contact_email?: string | null; contact_phone?: string | null; amenities?: string[] | null; created_by?: string | null; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      campuses: {
        Row: { id: string; institution_id: string; name: string; address: string | null; lat: number | null; lng: number | null; created_at: string; };
        Insert: { id?: string; institution_id: string; name: string; address?: string | null; lat?: number | null; lng?: number | null; created_at?: string; };
        Update: { id?: string; institution_id?: string; name?: string; address?: string | null; lat?: number | null; lng?: number | null; created_at?: string; };
        Relationships: [{ foreignKeyName: "campuses_institution_id_fkey"; columns: ["institution_id"]; isOneToOne: false; referencedRelation: "institutions"; referencedColumns: ["id"]; }];
      };
      buildings: {
        Row: { id: string; institution_id: string; campus_id: string | null; name: string; address: string | null; lat: number | null; lng: number | null; created_at: string; };
        Insert: { id?: string; institution_id: string; campus_id?: string | null; name: string; address?: string | null; lat?: number | null; lng?: number | null; created_at?: string; };
        Update: { id?: string; institution_id?: string; campus_id?: string | null; name?: string; address?: string | null; lat?: number | null; lng?: number | null; created_at?: string; };
        Relationships: [
          { foreignKeyName: "buildings_institution_id_fkey"; columns: ["institution_id"]; isOneToOne: false; referencedRelation: "institutions"; referencedColumns: ["id"]; },
          { foreignKeyName: "buildings_campus_id_fkey"; columns: ["campus_id"]; isOneToOne: false; referencedRelation: "campuses"; referencedColumns: ["id"]; }
        ];
      };
      spaces: {
        Row: { id: string; building_id: string; name: string; capacity: number; image_url: string | null; features: string[] | null; price_per_unit: number; price_unit: Database["public"]["Enums"]["price_unit"]; is_active: boolean; created_at: string; updated_at: string; };
        Insert: { id?: string; building_id: string; name: string; capacity?: number; image_url?: string | null; features?: string[] | null; price_per_unit?: number; price_unit?: Database["public"]["Enums"]["price_unit"]; is_active?: boolean; created_at?: string; updated_at?: string; };
        Update: { id?: string; building_id?: string; name?: string; capacity?: number; image_url?: string | null; features?: string[] | null; price_per_unit?: number; price_unit?: Database["public"]["Enums"]["price_unit"]; is_active?: boolean; created_at?: string; updated_at?: string; };
        Relationships: [{ foreignKeyName: "spaces_building_id_fkey"; columns: ["building_id"]; isOneToOne: false; referencedRelation: "buildings"; referencedColumns: ["id"]; }];
      };
      bookings: {
        Row: { id: string; space_id: string; user_id: string; date: string; start_time: string; end_time: string; status: Database["public"]["Enums"]["booking_status"]; rejection_reason: string | null; notes: string | null; total_price: number; created_at: string; updated_at: string; };
        Insert: { id?: string; space_id: string; user_id: string; date: string; start_time: string; end_time: string; status?: Database["public"]["Enums"]["booking_status"]; rejection_reason?: string | null; notes?: string | null; total_price?: number; created_at?: string; updated_at?: string; };
        Update: { id?: string; space_id?: string; user_id?: string; date?: string; start_time?: string; end_time?: string; status?: Database["public"]["Enums"]["booking_status"]; rejection_reason?: string | null; notes?: string | null; total_price?: number; created_at?: string; updated_at?: string; };
        Relationships: [{ foreignKeyName: "bookings_space_id_fkey"; columns: ["space_id"]; isOneToOne: false; referencedRelation: "spaces"; referencedColumns: ["id"]; }];
      };
      institution_requests: {
        Row: { id: string; requester_user_id: string | null; requester_email: string; requester_name: string; institution_name: string; institution_type: Database["public"]["Enums"]["institution_type"]; city: string | null; address: string | null; description: string | null; status: Database["public"]["Enums"]["request_status"]; rejection_reason: string | null; reviewed_by: string | null; reviewed_at: string | null; created_at: string; };
        Insert: { id?: string; requester_user_id?: string | null; requester_email: string; requester_name: string; institution_name: string; institution_type: Database["public"]["Enums"]["institution_type"]; city?: string | null; address?: string | null; description?: string | null; status?: Database["public"]["Enums"]["request_status"]; rejection_reason?: string | null; reviewed_by?: string | null; reviewed_at?: string | null; created_at?: string; };
        Update: { id?: string; requester_user_id?: string | null; requester_email?: string; requester_name?: string; institution_name?: string; institution_type?: Database["public"]["Enums"]["institution_type"]; city?: string | null; address?: string | null; description?: string | null; status?: Database["public"]["Enums"]["request_status"]; rejection_reason?: string | null; reviewed_by?: string | null; reviewed_at?: string | null; created_at?: string; };
        Relationships: [];
      };
      payment_methods: {
        Row: { id: string; user_id: string; cardholder: string; brand: string; last4: string; exp_month: string; exp_year: string; is_default: boolean; created_at: string; };
        Insert: { id?: string; user_id: string; cardholder: string; brand: string; last4: string; exp_month: string; exp_year: string; is_default?: boolean; created_at?: string; };
        Update: { id?: string; user_id?: string; cardholder?: string; brand?: string; last4?: string; exp_month?: string; exp_year?: string; is_default?: boolean; created_at?: string; };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never; };
    Functions: { has_role: { Args: { _user_id: string; _role: Database["public"]["Enums"]["app_role"]; }; Returns: boolean; }; };
    Enums: {
      app_role: "super_admin" | "institution_admin" | "campus_admin" | "staff" | "user";
      institution_type: "hotel" | "university" | "sports" | "garden" | "airbnb";
      price_unit: "hour" | "night" | "month";
      booking_status: "pending" | "approved" | "rejected" | "cancelled";
      request_status: "pending" | "approved" | "rejected";
    };
    CompositeTypes: { [_ in never]: never; };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "institution_admin", "campus_admin", "staff", "user"],
      booking_status: ["pending", "approved", "rejected", "cancelled"],
      institution_type: ["hotel", "university", "sports", "garden", "airbnb"],
      price_unit: ["hour", "night", "month"],
      request_status: ["pending", "approved", "rejected"],
    },
  },
} as const;
