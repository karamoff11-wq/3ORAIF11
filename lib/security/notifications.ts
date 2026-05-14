/**
 * lib/security/notifications.ts
 * ────────────────────────────────────────────────
 * Server-side helpers to generate admin notifications.
 * Writes to the `admin_notifications` table (created in phase_4_notifications.sql).
 */

import { createAdminClient } from '@/lib/supabaseServer'

export type NotificationType = 'warning' | 'error' | 'info' | 'success'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  created_at: string
  action_url?: string | null
}

/**
 * Create a new notification. Fails silently.
 */
export async function createNotification(params: {
  type: NotificationType
  title: string
  message: string
  action_url?: string
}): Promise<void> {
  try {
    const supabase = createAdminClient()
    await (supabase.from('admin_notifications') as any).insert({
      type: params.type,
      title: params.title,
      message: params.message,
      action_url: params.action_url ?? null,
      read: false,
    })
  } catch (err) {
    console.warn('[Notifications] Failed to create notification:', err)
  }
}

/**
 * Run health checks and create notifications for any issues found.
 * Call this on admin page load or from a scheduled function.
 */
export async function runHealthChecks(): Promise<void> {
  try {
    const supabase = createAdminClient()

    // Check: Categories with fewer than 5 questions
    const { data: cats } = await (supabase.from('categories') as any).select('id, name')

    if (cats) {
      for (const cat of cats) {
        const { count } = await (supabase
          .from('questions') as any)
          .select('id', { count: 'exact', head: true })
          .eq('category_id', cat.id)

        if ((count ?? 0) < 5) {
          const today = new Date().toISOString().split('T')[0]
          const { data: existing } = await (supabase.from('admin_notifications') as any)
            .select('id')
            .eq('title', `فئة تحتاج أسئلة: ${cat.name}`)
            .gte('created_at', today)
            .limit(1)

          if (!existing || existing.length === 0) {
            await createNotification({
              type: 'warning',
              title: `فئة تحتاج أسئلة: ${cat.name}`,
              message: `فئة "${cat.name}" تحتوي على ${count ?? 0} أسئلة فقط. يُنصح بإضافة المزيد.`,
              action_url: '/admin/questions',
            })
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Notifications] Health check failed:', err)
  }
}
