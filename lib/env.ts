export const env = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xvengdlpiyjatjttquqk.supabase.co",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2ZW5nZGxwaXlqYXRqdHRxdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAwNzQ0MDYsImV4cCI6MjA1NTY1MDQwNn0.DZz4Z4tW52UOmEFN-CXoqnEm2V6HSdylyM8y_QCcpx4",
  MAIL_TM_API_URL: process.env.MAIL_TM_API_URL || "https://api.mail.tm",
} as const;

export type Env = typeof env;