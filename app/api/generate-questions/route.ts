import { NextResponse } from 'next/server'
import { generateNewQuestions } from '@/lib/aiService'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { categoryId, categoryName, difficulty, count, exclude } = await req.json()

    if (!categoryId || !categoryName || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log(`Generating ${count} ${difficulty} questions for ${categoryName} (excluding ${exclude?.length || 0})...`)
    
    const newQuestions = await generateNewQuestions(categoryName, difficulty, count || 3, exclude || [])

    if (newQuestions.length === 0) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
    }

    // Insert into DB for future use
    const inserts = newQuestions.map((q: any) => ({
      category_id: categoryId,
      difficulty: q.difficulty || difficulty, // Use AI's difficulty or fallback
      question: q.question,
      answer: q.answer
    }))

    const { data, error } = await supabaseAdmin
      .from('questions')
      .upsert(inserts, { onConflict: 'category_id, question' })
      .select()

    if (error) {
      console.error('DB Upsert Error:', error)
      return NextResponse.json({ error: 'Failed to save questions to DB' }, { status: 500 })
    }

    return NextResponse.json({ questions: data })
  } catch (error: any) {
    console.error('API Route Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
