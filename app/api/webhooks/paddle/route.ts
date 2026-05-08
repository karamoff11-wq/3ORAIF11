import { createClient } from '@/lib/supabaseServer'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── Paddle Webhook Handler ──────────────────────────────────────────
// Receives events from Paddle and updates the user's plan in Supabase
// Set the webhook URL in Paddle Dashboard → Notifications → Add Endpoint:
//   https://abu-al-areef-trivia-main.vercel.app/api/webhooks/paddle

// Paddle sends a signature header — we verify it to prevent spoofing.
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET ?? ''

async function verifyPaddleSignature(request: NextRequest, rawBody: string): Promise<boolean> {
  // If no secret configured (dev mode), skip verification
  if (!PADDLE_WEBHOOK_SECRET) {
    console.warn('[Paddle] No webhook secret set — skipping signature verification')
    return true
  }

  const signatureHeader = request.headers.get('paddle-signature')
  if (!signatureHeader) return false

  // Parse ts= and h1= from the header
  const parts = Object.fromEntries(
    signatureHeader.split(';').map(p => p.split('=') as [string, string])
  )
  const ts = parts['ts']
  const h1 = parts['h1']
  if (!ts || !h1) return false

  // HMAC-SHA256 verification
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(PADDLE_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  )
  const payload = `${ts}:${rawBody}`
  const signatureBytes = Uint8Array.from(Buffer.from(h1, 'hex'))
  const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(payload))
  return isValid
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  // ── Signature Verification ──
  const isValid = await verifyPaddleSignature(request, rawBody)
  if (!isValid) {
    console.error('[Paddle] Invalid webhook signature')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventType = event.event_type as string
  const data = event.data as Record<string, unknown>

  console.log(`[Paddle] Received event: ${eventType}`)

  const supabase = await createClient()

  // ── Handle Subscription Events ──────────────────────────────────
  if (eventType === 'subscription.created' || eventType === 'subscription.updated') {
    const customData = data.custom_data as Record<string, string> | null
    const userId = customData?.user_id

    if (!userId) {
      console.error('[Paddle] No user_id in custom_data')
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 })
    }

    const subscriptionId   = data.id as string
    const status           = data.status as string          // active | canceled | past_due
    const priceId          = (data.items as Array<Record<string, unknown>>)?.[0]?.price_id as string
    const periodEnd        = (data.current_billing_period as Record<string, string>)?.ends_at

    // Map price_id → plan_type
    const proPriceId  = process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO  ?? ''
    const teamPriceId = process.env.NEXT_PUBLIC_PADDLE_PRICE_TEAM ?? ''
    const planType = priceId === teamPriceId ? 'team' : priceId === proPriceId ? 'pro' : 'free'

    // Upsert into subscriptions table
    const { error: subError } = await supabase
      .from('subscriptions')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({
        user_id:                userId,
        paddle_subscription_id: subscriptionId,
        status,
        plan_type:              planType,
        current_period_end:     periodEnd ?? null,
      } as any, { onConflict: 'user_id' })

    if (subError) {
      console.error('[Paddle] Subscription upsert error:', subError)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // Also update the plan_type on the profiles table for fast reads
    await supabase
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ plan_type: status === 'active' ? planType : 'free' } as any)
      .eq('id', userId)

    console.log(`[Paddle] Updated user ${userId} to plan: ${planType} (${status})`)
  }

  // ── Handle Subscription Cancelled ──────────────────────────────
  if (eventType === 'subscription.canceled') {
    const customData = data.custom_data as Record<string, string> | null
    const userId = customData?.user_id

    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('profiles').update({ plan_type: 'free' } as any).eq('id', userId)
      await supabase
        .from('subscriptions')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ status: 'canceled' } as any)
        .eq('user_id', userId)

      console.log(`[Paddle] Downgraded user ${userId} to free (canceled)`)
    }
  }

  // ── Record Payment ──────────────────────────────────────────────
  if (eventType === 'transaction.completed') {
    const customData = data.custom_data as Record<string, string> | null
    const userId = customData?.user_id
    const totals = data.details as Record<string, Record<string, string>>

    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from('payments').insert({
        user_id:               userId,
        type:                  'subscription',
        status:                'completed',
        paddle_transaction_id: data.id as string,
        amount:                Number(totals?.totals?.total ?? 0) / 100,
        currency:              data.currency_code as string,
      } as any)
    }
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
