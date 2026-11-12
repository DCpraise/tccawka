export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      attendance_records: {
        Row: { device_info: string | null; guest_member_id: string | null; id: string; location: Json | null; scanned_at: string; session_id: string; user_id: string | null }
        Insert: { device_info?: string | null; guest_member_id?: string | null; id?: string; location?: Json | null; scanned_at?: string; session_id: string; user_id?: string | null }
        Update: { device_info?: string | null; guest_member_id?: string | null; id?: string; location?: Json | null; scanned_at?: string; session_id?: string; user_id?: string | null }
        Relationships: []
      }
      attendance_sessions: {
        Row: { created_at: string; created_by: string; description: string | null; expires_at: string; id: string; qr_token: string; title: string; service_type: string }
        Insert: { created_at?: string; created_by: string; description?: string | null; expires_at: string; id?: string; qr_token: string; title: string; service_type?: string }
        Update: { created_at?: string; created_by?: string; description?: string | null; expires_at?: string; id?: string; qr_token?: string; title?: string; service_type?: string }
        Relationships: []
      }
      guest_members: {
        Row: { created_at: string; id: string; location: string; lodge: string | null; name: string; phone: string; member_type: string; dob: string | null; notes: string | null; followup_status: string; fellowship_id: string | null; gender: string | null; first_visit_date: string; qr_token: string | null }
        Insert: { created_at?: string; id?: string; location: string; lodge?: string | null; name: string; phone: string; member_type?: string; dob?: string | null; notes?: string | null; followup_status?: string; fellowship_id?: string | null; gender?: string | null; first_visit_date?: string; qr_token?: string | null }
        Update: { created_at?: string; id?: string; location?: string; lodge?: string | null; name?: string; phone?: string; member_type?: string; dob?: string | null; notes?: string | null; followup_status?: string; fellowship_id?: string | null; gender?: string | null; first_visit_date?: string; qr_token?: string | null }
        Relationships: []
      }
      profiles: {
        Row: { created_at: string; email: string; id: string; name: string; member_type: string; dob: string | null; notes: string | null; fellowship_id: string | null; gender: string | null; qr_token: string | null }
        Insert: { created_at?: string; email: string; id: string; name: string; member_type?: string; dob?: string | null; notes?: string | null; fellowship_id?: string | null; gender?: string | null; qr_token?: string | null }
        Update: { created_at?: string; email?: string; id?: string; name?: string; member_type?: string; dob?: string | null; notes?: string | null; fellowship_id?: string | null; gender?: string | null; qr_token?: string | null }
        Relationships: []
      }
      user_roles: {
        Row: { created_at: string; id: string; role: "admin" | "staff" | "user" | "fellowship_leader"; user_id: string; fellowship_id: string | null }
        Insert: { created_at?: string; id?: string; role: "admin" | "staff" | "user" | "fellowship_leader"; user_id: string; fellowship_id?: string | null }
        Update: { created_at?: string; id?: string; role?: "admin" | "staff" | "user" | "fellowship_leader"; user_id?: string; fellowship_id?: string | null }
        Relationships: []
      }
      fellowships: {
        Row: { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
        Relationships: []
      }
      location_fellowship_map: {
        Row: { id: string; location: string; fellowship_id: string; created_at: string }
        Insert: { id?: string; location: string; fellowship_id: string; created_at?: string }
        Update: { id?: string; location?: string; fellowship_id?: string; created_at?: string }
        Relationships: []
      }
      evolve_registrations: {
        Row: { id: string; full_name: string; email: string; phone: string | null; is_member: boolean; heard_from: string | null; reminder_channel: "email" | "whatsapp" | "both"; category: "member" | "worker" | "state_pastor" | "campus_pastor"; ticket_code: string; payment_status: "free" | "pending" | "paid"; amount_paid: number | null; payment_reference: string | null; paid_at: string | null; reminder_7d_sent_at: string | null; reminder_1d_sent_at: string | null; reminder_2h_sent_at: string | null; created_at: string }
        Insert: { id?: string; full_name: string; email: string; phone?: string | null; is_member?: boolean; heard_from?: string | null; reminder_channel?: "email" | "whatsapp" | "both"; category?: "member" | "worker" | "state_pastor" | "campus_pastor"; ticket_code: string; payment_status?: "free" | "pending" | "paid"; amount_paid?: number | null; payment_reference?: string | null; paid_at?: string | null; created_at?: string }
        Update: { full_name?: string; email?: string; phone?: string | null; heard_from?: string | null; reminder_channel?: "email" | "whatsapp" | "both"; category?: "member" | "worker" | "state_pastor" | "campus_pastor"; payment_status?: "free" | "pending" | "paid"; amount_paid?: number | null; payment_reference?: string | null; paid_at?: string | null; reminder_7d_sent_at?: string | null; reminder_1d_sent_at?: string | null; reminder_2h_sent_at?: string | null }
        Relationships: []
      }
      evolve_checkins: {
        Row: { id: string; registration_id: string; event_day: string; checked_in_at: string; checked_in_by: string | null }
        Insert: { id?: string; registration_id: string; event_day: string; checked_in_at?: string; checked_in_by?: string | null }
        Update: { event_day?: string }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { has_role: { Args: { _role: "admin" | "staff" | "user"; _user_id: string }; Returns: boolean } }
    Enums: { app_role: "admin" | "staff" | "user" }
    CompositeTypes: { [_ in never]: never }
  }
}
