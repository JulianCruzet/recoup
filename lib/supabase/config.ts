// Both values are public by design (the publishable key only allows what Supabase's auth rules allow).
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
