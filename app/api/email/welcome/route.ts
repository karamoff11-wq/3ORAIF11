// app/api/email/welcome/route.ts
// Called after a new user signs up to send a welcome email via Resend.
// Two auth modes:
//   1. Internal (server-to-server): Bearer ${SUPABASE_SERVICE_ROLE_KEY}
//   2. Public signup trigger: no auth required — rate-limited naturally by
//      the Supabase signup flow (one call per new account).

export const dynamic = 'force-dynamic'

import { sendWelcomeEmail } from '@/lib/email'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  // Allow internal calls authenticated with the service-role key
  const authHeader = request.headers.get('authorization')
  const secret     = process.env.SUPABASE_SERVICE_ROLE_KEY

  // If auth header is provided, it must match the secret
  if (authHeader && secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { email?: string; name?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, name } = body
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  // Skip silently if Resend is not configured (dev environment)
  if (!process.env.RESEND_API_KEY) {
    console.log('[Email] RESEND_API_KEY not set — skipping welcome email for:', email)
    return NextResponse.json({ sent: false, reason: 'not_configured' })
  }

  const result = await sendWelcomeEmail({ to: email, name: name ?? email })

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ sent: true })
}
