import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Since we're not using Supabase OAuth, we can just redirect to dashboard
  // We'll implement proper auth callback handling when we add Supabase back
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
