import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const supabaseUrl = "https://xvengdlpiyjatjttquqk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2ZW5nZGxwaXlqYXRqdHRxdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNzQ0MDYsImV4cCI6MjA1NTY1MDQwNn0.DZz4Z4tW52UOmEFN-CXoqnEm2V6HSdylyM8y_QCcpx4";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
  },
});

export function getSupabaseClient() {
  return supabase;
}
