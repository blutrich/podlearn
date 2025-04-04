export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      episodes: {
        Row: {
          assemblyai_transcript_id: string | null
          audio_url: string | null
          created_at: string | null
          description: string | null
          duration: number | null
          episode_number: number | null
          id: string
          image_url: string | null
          lesson_generation_status: string | null
          max_transcription_duration: unknown | null
          original_id: string | null
          podcast_id: number | null
          published_at: string | null
          season_number: number | null
          title: string
          transcription_error: string | null
          transcription_id: string | null
          transcription_started_at: string | null
          transcription_status: string | null
          transcription_timeout_at: string | null
          updated_at: string | null
        }
        Insert: {
          assemblyai_transcript_id?: string | null
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          episode_number?: number | null
          id?: string
          image_url?: string | null
          lesson_generation_status?: string | null
          max_transcription_duration?: unknown | null
          original_id?: string | null
          podcast_id?: number | null
          published_at?: string | null
          season_number?: number | null
          title: string
          transcription_error?: string | null
          transcription_id?: string | null
          transcription_started_at?: string | null
          transcription_status?: string | null
          transcription_timeout_at?: string | null
          updated_at?: string | null
        }
        Update: {
          assemblyai_transcript_id?: string | null
          audio_url?: string | null
          created_at?: string | null
          description?: string | null
          duration?: number | null
          episode_number?: number | null
          id?: string
          image_url?: string | null
          lesson_generation_status?: string | null
          max_transcription_duration?: unknown | null
          original_id?: string | null
          podcast_id?: number | null
          published_at?: string | null
          season_number?: number | null
          title?: string
          transcription_error?: string | null
          transcription_id?: string | null
          transcription_started_at?: string | null
          transcription_status?: string | null
          transcription_timeout_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          credits: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          credits?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          credits?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: string
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          plan: string
          status: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          plan?: string
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_episode_usage: {
        Row: {
          id: string
          user_id: string
          episode_id: string
          is_trial: boolean
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          episode_id: string
          is_trial?: boolean
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          episode_id?: string
          is_trial?: boolean
          created_at?: string | null
        }
        Relationships: []
      }
      generated_lessons: {
        Row: {
          content: string
          created_at: string | null
          episode_id: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          episode_id?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          episode_id?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_lessons_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_lessons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_progress: {
        Row: {
          completed: boolean | null
          created_at: string | null
          episode_id: string | null
          id: string
          last_position: number | null
          progress_percentage: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          episode_id?: string | null
          id?: string
          last_position?: number | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          episode_id?: string | null
          id?: string
          last_position?: number | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      podcasts: {
        Row: {
          author: string | null
          categories: string[] | null
          created_at: string | null
          description: string | null
          feed_url: string
          id: number
          image_url: string | null
          language: string | null
          title: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          author?: string | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          feed_url: string
          id: number
          image_url?: string | null
          language?: string | null
          title: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          author?: string | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          feed_url?: string
          id?: number
          image_url?: string | null
          language?: string | null
          title?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      transcriptions: {
        Row: {
          content: string
          created_at: string | null
          end_time: number
          entities: Json | null
          episode_id: string
          id: string
          sentiment: string | null
          sentiment_confidence: number | null
          speaker: string | null
          start_time: number
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          end_time: number
          entities?: Json | null
          episode_id: string
          id?: string
          sentiment?: string | null
          sentiment_confidence?: number | null
          speaker?: string | null
          start_time: number
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          end_time?: number
          entities?: Json | null
          episode_id?: string
          id?: string
          sentiment?: string | null
          sentiment_confidence?: number | null
          speaker?: string | null
          start_time?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_podcast_progress: {
        Row: {
          created_at: string
          episode_id: string
          id: string
          is_completed: boolean | null
          progress_seconds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          episode_id: string
          id?: string
          is_completed?: boolean | null
          progress_seconds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          episode_id?: string
          id?: string
          is_completed?: boolean | null
          progress_seconds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_podcast_progress_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          learning_pace: string | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          learning_pace?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          learning_pace?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referrals: {
        Row: {
          id: string;
          referrer_id: string;
          referred_id: string;
          status: string;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          referrer_id: string;
          referred_id: string;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          referrer_id?: string;
          referred_id?: string;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_referrals_referrer_id_fkey";
            columns: ["referrer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_referrals_referred_id_fkey";
            columns: ["referred_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      podcast_folders: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "podcast_folders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      podcast_folder_items: {
        Row: {
          id: string
          folder_id: string
          podcast_id: number
          created_at: string | null
        }
        Insert: {
          id?: string
          folder_id: string
          podcast_id: number
          created_at?: string | null
        }
        Update: {
          id?: string
          folder_id?: string
          podcast_id?: number
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "podcast_folder_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "podcast_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "podcast_folder_items_podcast_id_fkey"
            columns: ["podcast_id"]
            isOneToOne: false
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          }
        ]
      }
      saved_podcasts: {
        Row: {
          id: string
          user_id: string
          podcast_id: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          podcast_id: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          podcast_id?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_podcasts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_podcasts_podcast_id_fkey"
            columns: ["podcast_id"]
            referencedRelation: "podcasts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_episode_original_id: {
        Args: {
          episode_id_to_check: string
        }
        Returns: {
          found: boolean
          episode_id: string
          transcription_count: number
          transcription_status: string
        }[]
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
