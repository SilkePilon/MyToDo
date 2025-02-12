export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          name: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          name?: string | null
          user_id?: string | null
        }
      }
      todo_items: {
        Row: {
          completed: boolean | null
          created_at: string | null
          deadline: string | null
          emoji: string | null
          id: string
          project_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          deadline?: string | null
          emoji?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          deadline?: string | null
          emoji?: string | null
          id?: string
          project_id?: string | null
          title?: string | null
          user_id?: string | null
        }
      }
      users: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          updated_at?: string | null
        }
      }
      planner_entries: {
        Row: {
          content: string | null
          created_at: string | null
          date: string | null
          emoji: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          date?: string | null
          emoji?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          date?: string | null
          emoji?: string | null
          id?: string
          user_id?: string | null
        }
      }
    }
    Views: {
      ["projects_with_users"]: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          name: string | null
          user_email: string | null
          user_id: string | null
        }
      }
      ["todo_items_with_users"]: {
        Row: {
          completed: boolean | null
          created_at: string | null
          deadline: string | null
          emoji: string | null
          id: string
          project_id: string | null
          project_name: string | null
          title: string | null
          user_email: string | null
          user_id: string | null
        }
      }
      ["planner_entries_with_users"]: {
        Row: {
          content: string | null
          created_at: string | null
          date: string | null
          emoji: string | null
          id: string
          user_email: string | null
          user_id: string | null
        }
      }
    }
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

