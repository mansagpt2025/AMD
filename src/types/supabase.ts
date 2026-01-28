export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      packages: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          grade: string
          type: string
          lecture_count: number
          duration_days: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price?: number
          image_url?: string | null
          grade: string
          type: string
          lecture_count?: number
          duration_days?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          grade?: string
          type?: string
          lecture_count?: number
          duration_days?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      lectures: {
        Row: {
          id: string
          package_id: string
          title: string
          description: string | null
          image_url: string | null
          order_number: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          package_id: string
          title: string
          description?: string | null
          image_url?: string | null
          order_number?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          package_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          order_number?: number
          is_active?: boolean
          created_at?: string
        }
      }
      lecture_contents: {
        Row: {
          id: string
          lecture_id: string
          type: string
          title: string
          description: string | null
          content_url: string | null
          duration_minutes: number
          order_number: number
          is_active: boolean
          max_attempts: number
          pass_score: number
          created_at: string
        }
        Insert: {
          id?: string
          lecture_id: string
          type: string
          title: string
          description?: string | null
          content_url?: string | null
          duration_minutes?: number
          order_number?: number
          is_active?: boolean
          max_attempts?: number
          pass_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          lecture_id?: string
          type?: string
          title?: string
          description?: string | null
          content_url?: string | null
          duration_minutes?: number
          order_number?: number
          is_active?: boolean
          max_attempts?: number
          pass_score?: number
          created_at?: string
        }
      }
    }
  }
}