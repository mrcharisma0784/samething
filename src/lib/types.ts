export type VoteValue = "same" | "nah";
export type NotifType = "same" | "nah" | "comment" | "reply" | "mention" | "only_one";
export type Plan = "simplething" | "premiumthing";

export interface Profile {
  id: string;
  username: string;
  emoji: string;
  bio: string | null;
  plan: Plan;
  feed_lang: string;

  allow_mentions: boolean;
  open_to_chat: boolean;

  notify_same: boolean;
  notify_nah: boolean;
  notify_comment: boolean;
  notify_reply: boolean;
  notify_mention: boolean;
  notify_only_one: boolean;
  notify_marketing: boolean;

  strikes: number;
  muted_until: string | null;

  created_at: string;
}

/** things_feed view — feed'in tek kaynagi */
export interface Thing {
  id: string;
  user_id: string;
  title: string | null;
  body: string;
  tags: string[];
  lang: string;
  is_anonymous: boolean;
  comments_closed: boolean;
  ai_simplified: boolean;
  hidden: boolean;
  hidden_reason: string | null;
  created_at: string;
  username: string | null;   // anonimse null
  emoji: string | null;
  total_votes: number;
  same_votes: number;
  similarity: number | null; // 0..1 — kimse oy vermediyse null
  comment_count: number;
  is_rare: boolean;
  is_featured: boolean;
}

/** comments_view — anonim yorumcunun username'i DB'de kesilir, null gelir. */
export interface Comment {
  id: string;
  thing_id: string;
  parent_id: string | null;
  body: string;
  is_anonymous: boolean;
  pinned: boolean;
  hidden: boolean;
  created_at: string;
  user_id: string | null;
  username: string | null;
  emoji: string | null;
  is_creator: boolean;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotifType;
  thing_id: string | null;
  actor_id: string | null;
  preview: string | null;
  pinned: boolean;
  dismissed: boolean;
  read: boolean;
  created_at: string;
}

export interface ProfileStats {
  profile_id: string;
  things_count: number;
  rare_count: number;
}

// supabase-js jenerigi icin minimal tanim.
// `supabase gen types typescript` ile uretileni buraya koyabilirsin.
export type Database = any;
