import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn("Supabase env vars are missing — persistence and realtime sync will not work.");
}

// Fall back to placeholder values so createClient doesn't throw when env vars
// are absent (e.g. during prerendering in a misconfigured build) — real values
// are required at runtime for the client to actually work.
export const supabase = createClient(url || "https://placeholder.supabase.co", key || "placeholder-anon-key");
