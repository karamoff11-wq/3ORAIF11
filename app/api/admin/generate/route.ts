import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  return NextResponse.json({ 
    message: 'API endpoint. Deploy as Cloudflare Worker for full functionality.',
    available: false
  })
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Admin question generation requires Cloudflare Worker deployment',
    available: false
  })
}