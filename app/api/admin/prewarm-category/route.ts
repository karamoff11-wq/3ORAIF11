import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { logAdminAction } from '@/lib/security/auditLog'

/**
 * POST /api/admin/prewarm-category
 * Triggers the Supabase Edge Function to pre-generate seed questions
 * for a newly created category.
 *
 * Body: { categoryId: string, categoryName: string }
 */
export async function POST(req: Request) {
  try {
    // Auth check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { categoryId, categoryName } = body

    if (!categoryId || !categoryName) {
      return NextResponse.json({ error: 'Missing categoryId or categoryName' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()
    const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    // Fire-and-forget: call the Edge Function asynchronously
    // We don't await it so the admin UI responds immediately
    const edgeFnUrl = `${projectUrl}/functions/v1/prewarm-category`
    fetch(edgeFnUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ categoryId, categoryName }),
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.text()
        console.error('[prewarm-category] Edge Function error:', err)
      } else {
        console.log(`[prewarm-category] ✅ Pre-warm triggered for "${categoryName}"`)
      }
    }).catch(err => {
      console.error('[prewarm-category] Fetch error:', err)
    })

    // Audit log
    await logAdminAction({
      admin_id: user.id,
      action: 'prewarm_category',
      target_id: String(categoryId),
      payload: { categoryName },
    })

    // Optimistic notification so admin sees it immediately
    await (supabaseAdmin.from('admin_notifications') as any).insert({
      type: 'info',
      title: `جاري تمهيد الفئة: ${categoryName}`,
      message: `بدأ توليد 15 سؤالاً تمهيدياً للفئة "${categoryName}". ستصلك إشعاراً عند الانتهاء.`,
      action_url: '/admin/questions',
    })

    return NextResponse.json({ ok: true, message: 'Pre-warm triggered in background' })

  } catch (err: any) {
    console.error('[prewarm-category] API error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
