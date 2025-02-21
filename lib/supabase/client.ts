import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://xvengdlpiyjatjttquqk.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2ZW5nZGxwaXlqYXRqdHRxdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNzQ0MDYsImV4cCI6MjA1NTY1MDQwNn0.DZz4Z4tW52UOmEFN-CXoqnEm2V6HSdylyM8y_QCcpx4";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
    },
  }
);

export function getSupabaseClient() {
  return supabase;
}
