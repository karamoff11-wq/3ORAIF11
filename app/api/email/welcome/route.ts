// app/api/email/welcome/route.ts
// Called after a new user signs up to send a welcome email via Resend.
// Supabase Auth Trigger → this endpoint → Resend

import { createClient } from '@/lib/supabaseServer'
import { sendWelcomeEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // Only allow calls with the service-role secret (internal)
  const authHeader = request.headers.get('authorization')
  const secret     = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { email, name } = await request.json() as { email: string; name?: string }
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const result = await sendWelcomeEmail({ to: email, name: name ?? email })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
