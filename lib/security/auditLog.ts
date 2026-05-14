/**
 * lib/security/auditLog.ts
 * ────────────────────────
 * Server-side audit logging helper.
 * Every admin action that mutates data should call `logAdminAction`.
 *
 * The `admin_audit_log` table must be created in Supabase — see:
 *   supabase/phase_3_audit_log.sql
 */

import { createAdminClient } from '@/lib/supabaseServer'

export type AuditAction =
  | 'delete_question'
  | 'bulk_delete_questions'
  | 'create_question'
  | 'update_question'
  | 'delete_category'
  | 'create_category'
  | 'update_category'
  | 'delete_topic'
  | 'create_topic'
  | 'update_topic'
  | 'update_scoring'
  | 'update_mascot'
  | 'update_theme'
  | 'update_landing'
  | 'generate_questions_ai'
  | 'delete_session'
  | 'force_end_session'
  | 'system_config_change'
  | 'prewarm_category'

export interface AuditLogEntry {
  admin_id: string
  action: AuditAction
  /** The primary resource ID affected (question ID, session ID, etc.) */
  target_id?: string
  /** Snapshot of the data before/after the action */
  payload?: Record<string, unknown>
}

/**
 * Write an admin action to the audit log table.
 * Fails silently so it never breaks the primary operation.
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = createAdminClient()
    const { error } = await (supabase.from('admin_audit_log') as any).insert({
      admin_id: entry.admin_id,
      action: entry.action,
      target_id: entry.target_id ?? null,
      payload: entry.payload ?? null,
    })
    if (error) {
      console.warn('[AuditLog] Failed to write audit entry:', error.message)
    }
  } catch (err) {
    console.warn('[AuditLog] Exception writing audit entry:', err)
  }
}

/**
 * Retrieve recent audit log entries for the admin dashboard.
 * Returns up to `limit` entries, newest first.
 */
export async function getRecentAuditLog(limit = 50): Promise<{
  id: string
  admin_id: string
  action: string
  target_id: string | null
  payload: Record<string, unknown> | null
  created_at: string
}[]> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await (supabase
      .from('admin_audit_log') as any)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data ?? []
  } catch (err) {
    console.warn('[AuditLog] Failed to fetch audit log:', err)
    return []
  }
}
