// Row shapes mirroring the D1 schema in /migrations.

export interface UserRow {
  id: string;
  platform: string;
  locale: string;
  created_at: number;
  last_seen_at: number;
  rc_app_user_id: string | null;
}

export interface EntitlementRow {
  user_id: string;
  premium_active: number; // 0 | 1
  premium_expires_at: number | null;
  premium_product: string | null;
  deep_pack_balance: number;
  first_deep_used: number; // 0 | 1
  updated_at: number;
}

export interface DailyUsageRow {
  user_id: string;
  usage_date: string; // 'YYYY-MM-DD' (UTC)
  kahin_count: number;
  deep_count: number;
  rewarded_kahin: number;
}

export interface ReadingRow {
  id: string;
  user_id: string;
  type: string; // 'kahin' | 'deep'
  locale: string;
  category: string | null;
  prompt_version: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  safety_flag: string | null;
  created_at: number;
  question_text: string | null;
  whisper_text: string | null;
  answer_text: string | null;
}

export interface ReportRow {
  id: string;
  user_id: string;
  reading_id: string | null;
  reason: string;
  detail: string | null;
  question_text: string | null;
  answer_text: string | null;
  status: string;
  created_at: number;
}
