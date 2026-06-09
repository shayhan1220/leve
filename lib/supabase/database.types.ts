export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Plan = 'free' | 'plus' | 'premium';
export type ReactionType = 'like' | 'super' | 'pass';
export type GatheringStatus = 'pending_review' | 'open' | 'full' | 'closed' | 'canceled';
export type GatheringSource = 'discover' | 'queer' | 'community' | 'direct';
export type ParticipantStatus = 'applied' | 'confirmed' | 'rejected';

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Profile = {
  user_id: string;
  nickname: string | null;
  age: number | null;
  region: string | null;
  height: number | null;
  job: string | null;
  bio: string | null;
  looking_for: string[];
  identity_tags: string[];
  queer_optin: boolean;
  queer_visible_in_main: boolean;
  completeness: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type LoveDnaProfile = {
  user_id: string;
  code: string;
  clan: 'Explorer' | 'Dreamer' | 'Thinker' | 'Caregiver' | 'Protector' | 'Builder';
  axis_s: number;
  axis_d: number;
  axis_a: number;
  axis_v: number;
  axis_m: number;
  answered_count: number;
  updated_at: string;
};

export type Gathering = {
  id: string;
  host_id: string;
  title: string;
  description: string;
  category: string;
  region: string;
  capacity: number;
  start_at: string;
  type: 'meetup' | 'flash';
  status: GatheringStatus;
  source: GatheringSource;
  is_queer: boolean;
  created_at: string;
  updated_at: string;
};

export type GatheringParticipant = {
  id: string;
  gathering_id: string;
  user_id: string;
  status: ParticipantStatus;
  created_at: string;
};

export type DiscoverFeedRow = {
  user_id: string;
  nickname: string | null;
  age: number | null;
  region: string | null;
  bio: string | null;
  looking_for: string[];
  identity_tags: string[];
  photo_path: string | null;
  compatibility: number;
  score_breakdown: Json;
  love_dna_clan: LoveDnaProfile['clan'] | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      verifications: Table<{
        user_id: string;
        is_verified: boolean;
        is_female: boolean;
        age: number | null;
        method: 'pass' | 'telco' | 'ipin' | null;
        provider_ref: string | null;
        verified_at: string | null;
        updated_at: string;
      }>;
      profiles: Table<Profile>;
      profile_photos: Table<{
        id: string;
        user_id: string;
        storage_path: string;
        order_idx: number;
        created_at: string;
      }>;
      badges: Table<{
        id: string;
        user_id: string;
        badge: 'female_safe' | 'identity' | 'job' | 'vip';
        granted_at: string;
      }>;
      subscriptions: Table<{
        user_id: string;
        plan: Plan;
        status: 'active' | 'expired' | 'canceled' | 'grace';
        rc_customer_id: string | null;
        store: string | null;
        started_at: string | null;
        expires_at: string | null;
        updated_at: string;
      }>;
      love_dna_responses: Table<{
        user_id: string;
        question_id: number;
        axis: 'S' | 'D' | 'A' | 'V' | 'M';
        value: number;
        updated_at: string;
      }>;
      love_dna_profiles: Table<LoveDnaProfile>;
      blocks: Table<{ blocker_id: string; blocked_id: string; created_at: string }>;
      likes: Table<{
        from_user: string;
        to_user: string;
        type: ReactionType;
        created_at: string;
      }>;
      matches: Table<{
        id: string;
        user_a: string;
        user_b: string;
        created_at: string;
      }>;
      chats: Table<{ id: string; match_id: string; created_at: string }>;
      messages: Table<{
        id: string;
        chat_id: string;
        sender_id: string;
        type: 'text' | 'image' | 'date_proposal' | 'system';
        body: string | null;
        storage_path: string | null;
        read_at: string | null;
        created_at: string;
      }>;
      date_proposals: Table<{
        id: string;
        chat_id: string;
        proposer_id: string;
        datetime: string;
        place: string;
        meetup_id: string | null;
        status: 'proposed' | 'accepted' | 'declined';
        created_at: string;
      }>;
      gatherings: Table<Gathering>;
      gathering_participants: Table<GatheringParticipant>;
      events: Table<{
        id: string;
        title: string;
        description: string;
        start_at: string;
        status: 'upcoming' | 'live' | 'ended' | 'canceled';
        qr_enabled: boolean;
        promo_code: string | null;
        is_queer: boolean;
      }>;
      event_attendance: Table<{
        event_id: string;
        user_id: string;
        qr_checkin_at: string | null;
        joined_at: string;
      }>;
      groups: Table<{
        id: string;
        name: string;
        description: string;
        is_queer: boolean;
        created_at: string;
      }>;
      group_members: Table<{
        group_id: string;
        user_id: string;
        role: 'member' | 'moderator' | 'owner';
        joined_at: string;
      }>;
      group_posts: Table<{
        id: string;
        group_id: string;
        author_id: string;
        body: string;
        created_at: string;
      }>;
      reports: Table<{
        id: string;
        reporter_id: string;
        target_user_id: string | null;
        context: string;
        reason: string;
        detail: string | null;
        status: string;
        created_at: string;
      }>;
      moderation_actions: Table<{
        id: string;
        actor_id: string | null;
        target_user_id: string | null;
        action: string;
        ref: string | null;
        note: string | null;
        created_at: string;
      }>;
      notifications: Table<{
        id: string;
        user_id: string;
        type: 'like' | 'match' | 'message' | 'event' | 'gathering' | 'system';
        title: string;
        body: string;
        data: Json;
        read_at: string | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: {
      is_verified_female: { Args: { uid?: string }; Returns: boolean };
      is_not_blocked: { Args: { target: string; viewer?: string }; Returns: boolean };
      current_plan: { Args: Record<PropertyKey, never>; Returns: Plan };
      compute_love_dna: { Args: Record<PropertyKey, never>; Returns: LoveDnaProfile };
      discover_feed: {
        Args: { filters?: Json; cursor?: string | null };
        Returns: DiscoverFeedRow[];
      };
      get_profile: { Args: { target_id: string }; Returns: Json };
      react: {
        Args: { to_user: string; type: ReactionType };
        Returns: Json;
      };
      who_liked_me: { Args: Record<PropertyKey, never>; Returns: Json };
      list_matches: { Args: Record<PropertyKey, never>; Returns: Json };
      mark_read: { Args: { chat_id: string }; Returns: number };
      can_create_gathering: { Args: Record<PropertyKey, never>; Returns: Json };
      create_gathering: { Args: { payload: Json }; Returns: Gathering };
      apply_gathering: { Args: { gathering_id: string }; Returns: string };
      review_participant: {
        Args: { participant_id: string; decision: string };
        Returns: GatheringParticipant;
      };
      cancel_gathering: { Args: { id: string }; Returns: Gathering };
      join_event: { Args: { event_id: string }; Returns: undefined };
      join_group: { Args: { group_id: string }; Returns: undefined };
      request_job_verification: { Args: { storage_path: string }; Returns: string };
      block_user: { Args: { target: string }; Returns: undefined };
      moderate: {
        Args: { target: string; action: string; ref?: string; note?: string };
        Returns: string;
      };
      my_applications: {
        Args: Record<PropertyKey, never>;
        Returns: GatheringParticipant[];
      };
      my_hosted_gatherings: {
        Args: Record<PropertyKey, never>;
        Returns: Gathering[];
      };
      mark_notifications_read: { Args: Record<PropertyKey, never>; Returns: number };
    };
    Enums: {
      plan: Plan;
      reaction_type: ReactionType;
      gathering_status: GatheringStatus;
      gathering_source: GatheringSource;
      participant_status: ParticipantStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
