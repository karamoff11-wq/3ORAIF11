import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { generateSession } from '@/lib/gemini'

export async function POST(req: Request) {
  try {
    // SECURITY 1 — API route has no authentication check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if ((profile as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { sessionId, teams, categories: categoryIds } = await req.json()

    // Validation
    if (!sessionId || !teams || !categoryIds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return NextResponse.json({ error: 'Categories must be a non-empty array' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // Resolve full category objects (Name, Topic) from DB
    const { data: resolvedCats, error: resolveError } = await (supabaseAdmin
      .from('categories') as any)
      .select('id, name, topics(name)')
      .in('id', categoryIds)

    if (resolveError || !resolvedCats) {
      throw new Error('Failed to resolve category metadata: ' + resolveError?.message)
    }

    // Map to the format expected by generateSession
    const categoriesForAI = categoryIds.map(id => {
      const cat = resolvedCats.find(c => c.id === id)
      return {
        id: id,
        name: cat?.name || 'فئة عامة',
        topicName: (cat as any)?.topics?.name || 'عام'
      }
    })

    // Generate questions via Gemini
    const questions = await generateSession({ 
      sessionId, 
      teams: teams as any, 
      categories: categoriesForAI 
    })

    // Insert into permanent QUESTIONS bank (Flow A: Admin pre-seeding)
    // Using upsert with question as conflict target to avoid duplicates
    const { error } = await (supabaseAdmin
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

    if (error) {
      console.error('Upsert error:', error)
      throw new Error('Failed to save questions to bank: ' + error.message)
    }


    return NextResponse.json({
      success: true,
      count: questions.length,
      message: 'تمت إضافة الأسئلة إلى بنك الأسئلة بنجاح'
    })


  } catch (err: any) {
    console.error('Session generation error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
