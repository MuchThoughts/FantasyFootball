import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!url || !key) {
  console.warn("Supabase env vars are missing — persistence and realtime sync will not work.");
}

export const supabase = createClient(url, key);
