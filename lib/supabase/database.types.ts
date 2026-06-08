export type Plan = 'free' | 'plus' | 'premium';

export type Database = {
  public: {
    Tables: {
      verifications: {
        Row: {
          user_id: string;
          is_verified: boolean;
          is_female: boolean;
          age: number | null;
          method: 'pass' | 'telco' | 'ipin' | null;
          provider_ref: string | null;
          verified_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      subscriptions: {
        Row: {
          user_id: string;
          plan: Plan;
          status: 'active' | 'expired' | 'canceled' | 'grace';
          expires_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_plan: { Args: Record<PropertyKey, never>; Returns: Plan };
    };
    Enums: { plan: Plan };
    CompositeTypes: Record<string, never>;
  };
};
