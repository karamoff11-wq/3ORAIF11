// hooks/usePlan.ts
// Fetches the current user's plan type from Supabase profiles
// Usage: const { plan, loading } = usePlan()

'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import type { PlanType } from '@/lib/paddle'

export function usePlan() {
  const [plan, setPlan]       = useState<PlanType>('free')
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchPlan() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from('profiles')
        .select('plan_type')
        .eq('id', user.id)
        .single()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPlan(((data as any)?.plan_type as PlanType) ?? 'free')

      setLoading(false)
    }

    fetchPlan()
  }, [supabase])

  return { plan, loading }
}
