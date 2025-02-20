import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL")
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Log the first 5 characters of the URL and key (for debugging, remove in production)
console.log("Supabase URL:", supabaseUrl.substring(0, 5) + "...")
console.log("Supabase Anon Key:", supabaseAnonKey.substring(0, 5) + "...")

