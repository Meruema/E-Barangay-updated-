export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ItemStatus =
  | 'available'
  | 'unavailable'
  | 'maintenance'
  | 'archived';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          username: string;
          password: string;
          email: string;
          role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
          barangay_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          password: string;
          email: string;
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
          barangay_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          password?: string;
          email?: string;
          role?: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
          barangay_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      barangays: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          details?: string | null;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category_id: string | null;
          type: string | null;
          status: ItemStatus;
          image_url: string | null;
          availability: string | null;
          booking_rules: string | null;
          payment: number | null; // ✅ added
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category_id?: string | null;
          type?: string | null;
          status?: ItemStatus;
          image_url?: string | null;
          availability?: string | null;
          booking_rules?: string | null;
          payment?: number | null; // ✅ added
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category_id?: string | null;
          type?: string | null;
          status?: ItemStatus;
          image_url?: string | null;
          availability?: string | null;
          booking_rules?: string | null;
          payment?: number | null; // ✅ added
          created_at?: string;
          updated_at?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          user_id: string;
          item_id: string;
          status: RequestStatus;
          reason: string | null;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          item_id: string;
          status?: RequestStatus;
          reason?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          item_id?: string;
          status?: RequestStatus;
          reason?: string | null;
          submitted_at?: string;
          updated_at?: string;
        };
      };
      request_actions: {
        Row: {
          id: string;
          request_id: string;
          admin_user_id: string | null;
          action_type: string;
          remarks: string | null;
          action_date: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          admin_user_id?: string | null;
          action_type: string;
          remarks?: string | null;
          action_date?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          admin_user_id?: string | null;
          action_type?: string;
          remarks?: string | null;
          action_date?: string;
        };
      };
      statistics: {
        Row: {
          id: string;
          generated_by_user_id: string | null;
          date_recorded: string;
          total_requests: number;
          approved_count: number;
          rejected_count: number;
          top_item_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          generated_by_user_id?: string | null;
          date_recorded: string;
          total_requests?: number;
          approved_count?: number;
          rejected_count?: number;
          top_item_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          generated_by_user_id?: string | null;
          date_recorded?: string;
          total_requests?: number;
          approved_count?: number;
          rejected_count?: number;
          top_item_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      item_status: ItemStatus;
      request_status: RequestStatus;
    };
  };
}

// Helper types for easier usage
export type Role = Database['public']['Tables']['roles']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type Request = Database['public']['Tables']['requests']['Row'];
export type RequestAction =
  Database['public']['Tables']['request_actions']['Row'];
export type Statistics = Database['public']['Tables']['statistics']['Row'];

// Extended types with relations
export type ItemWithCategory = Item & {
  category: Category | null;
};

export type RequestWithItem = Request & {
  item: ItemWithCategory | null;
};

export type RequestWithDetails = Request & {
  item: ItemWithCategory | null;
  actions: RequestAction[];
};
