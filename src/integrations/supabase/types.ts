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
      class_members: {
        Row: {
          class_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          language: string | null
          level: string | null
          name: string
          teacher_id: string
          track: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          level?: string | null
          name: string
          teacher_id: string
          track?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          level?: string | null
          name?: string
          teacher_id?: string
          track?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          description: string | null
          duration_weeks: number
          id: string
          is_active: boolean
          language_id: string
          lessons_count: number
          level: string
          price: number
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean
          language_id: string
          lessons_count?: number
          level: string
          price?: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean
          language_id?: string
          lessons_count?: number
          level?: string
          price?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_lessons: number
          course_id: string
          created_at: string
          id: string
          progress: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_lessons?: number
          course_id: string
          created_at?: string
          id?: string
          progress?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_lessons?: number
          course_id?: string
          created_at?: string
          id?: string
          progress?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_assignments: {
        Row: {
          created_at: string
          due_at: string | null
          exercise_id: string
          id: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          exercise_id: string
          id?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          exercise_id?: string
          id?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_assignments_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_submissions: {
        Row: {
          answers: Json
          attempt_number: number
          exercise_id: string
          id: string
          max_score: number
          score: number
          student_id: string
          submitted_at: string
        }
        Insert: {
          answers?: Json
          attempt_number?: number
          exercise_id: string
          id?: string
          max_score?: number
          score?: number
          student_id: string
          submitted_at?: string
        }
        Update: {
          answers?: Json
          attempt_number?: number
          exercise_id?: string
          id?: string
          max_score?: number
          score?: number
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_submissions_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          content: Json
          created_at: string
          id: string
          max_attempts: number
          published: boolean
          teacher_id: string
          time_limit_sec: number | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          max_attempts?: number
          published?: boolean
          teacher_id: string
          time_limit_sec?: number | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          max_attempts?: number
          published?: boolean
          teacher_id?: string
          time_limit_sec?: number | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          plan: string
          provider: string
          provider_ref: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          plan: string
          provider?: string
          provider_ref: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          plan?: string
          provider?: string
          provider_ref?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          flag: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          flag?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          flag?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      live_sessions: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          notes: string | null
          scheduled_at: string
          status: string
          student_id: string
          teacher_id: string
          updated_at: string
          zoom_link: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: string
          student_id: string
          teacher_id: string
          updated_at?: string
          zoom_link?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          student_id?: string
          teacher_id?: string
          updated_at?: string
          zoom_link?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          badges: Json
          bio: string | null
          cefr_level: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_premium: boolean
          kid_age: number | null
          kid_name: string | null
          learning_goal: string | null
          level: string | null
          parent_id: string | null
          points: number
          premium_until: string | null
          specialty_language: string | null
          teacher_profile_completed: boolean
          track: string | null
          updated_at: string
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          badges?: Json
          bio?: string | null
          cefr_level?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_premium?: boolean
          kid_age?: number | null
          kid_name?: string | null
          learning_goal?: string | null
          level?: string | null
          parent_id?: string | null
          points?: number
          premium_until?: string | null
          specialty_language?: string | null
          teacher_profile_completed?: boolean
          track?: string | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          badges?: Json
          bio?: string | null
          cefr_level?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_premium?: boolean
          kid_age?: number | null
          kid_name?: string | null
          learning_goal?: string | null
          level?: string | null
          parent_id?: string | null
          points?: number
          premium_until?: string | null
          specialty_language?: string | null
          teacher_profile_completed?: boolean
          track?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      progress: {
        Row: {
          id: string
          language: string | null
          score: number
          skill: string
          student_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          language?: string | null
          score?: number
          skill: string
          student_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          language?: string | null
          score?: number
          skill?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          start_time: string
          teacher_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          start_time: string
          teacher_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          start_time?: string
          teacher_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: []
      }
      teacher_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      teacher_widgets: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          language_id: string | null
          teacher_id: string
          title: string
          updated_at: string
          widget_type: string
        }
        Insert: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          language_id?: string | null
          teacher_id: string
          title: string
          updated_at?: string
          widget_type: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          language_id?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_widgets_language_id_fkey"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "languages"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_premium: {
        Args: {
          _amount: number
          _currency: string
          _days: number
          _plan: string
          _provider: string
          _provider_ref: string
        }
        Returns: {
          invoice_id: string
          premium_until: string
        }[]
      }
      admin_exists: { Args: never; Returns: boolean }
      bootstrap_first_admin: { Args: never; Returns: undefined }
      complete_enrollment: {
        Args: { _enrollment_id: string }
        Returns: {
          completed_lessons: number
          course_id: string
          created_at: string
          id: string
          progress: number
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "enrollments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_teacher_profile: {
        Args: {
          _avatar: string
          _bio: string
          _full_name: string
          _specialty: string
        }
        Returns: undefined
      }
      generate_teacher_code: { Args: { _expires_at?: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_exercise_assigned_to_user: {
        Args: { _exercise_id: string; _user_id: string }
        Returns: boolean
      }
      is_exercise_owner: {
        Args: { _exercise_id: string; _user_id: string }
        Returns: boolean
      }
      redeem_teacher_code: { Args: { _code: string }; Returns: undefined }
      submit_exercise: {
        Args: { _answers: Json; _exercise_id: string }
        Returns: {
          max_score: number
          score: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
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
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
