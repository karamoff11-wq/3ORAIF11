import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { generateSession } from '@/lib/gemini'

interface GenerateRequest {
  sessionId: string
  teams: number
  categories: string[]
}

interface ResolvedCategory {
  id: string
  name: string
  topics: {
    name: string
  } | null
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await (supabase.from('profiles') as any).select('role').eq('id', user.id).single()
    const userRole = profile?.role
    if (userRole !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { sessionId, teams, categories: categoryIds } = await req.json() as GenerateRequest

    if (!sessionId || !teams || !categoryIds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    const { data: resolvedCats, error: resolveError } = await supabaseAdmin
      .from('categories')
      .select('id, name, topics(name)')
      .in('id', categoryIds) as { data: ResolvedCategory[] | null, error: any }

    if (resolveError || !resolvedCats) {
      throw new Error('Failed to resolve categories')
    }

    const categoriesForAI = categoryIds.map(id => {
      const cat = resolvedCats.find(c => c.id === id)
      return {
        name: cat?.name || 'General',
        topicName: cat?.topics?.name || 'General'
      }
    })

    const questions = await generateSession({ 
      sessionId, 
      teams: teams as 2 | 3 | 4, 
      categories: categoriesForAI as any
    })

    const { error: upsertError } = await (supabaseAdmin
      .from('questions') as any)
      .upsert(
        questions.map(q => ({
          category_id: q.category_id,
          difficulty: q.difficulty,
          question: q.question,
          answer: q.answer
        })),
        { onConflict: 'question', ignoreDuplicates: true }
      )

    if (upsertError) throw upsertError

    return NextResponse.json({ success: true, count: questions.length })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
