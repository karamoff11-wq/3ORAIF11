import { NextResponse } from 'next/server';


export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasGeminiKey: !!process.env.GEMINI_API_KEY
    }
  });
}
