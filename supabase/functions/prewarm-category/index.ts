// supabase/functions/prewarm-category/index.ts
// ─────────────────────────────────────────────────────────────────────
// 3.4 — Server-Side Question Pre-warming
//
// This Supabase Edge Function is called when a new category is created
// in /admin/categories. It generates 15 seed questions (5 easy, 5 medium,
// 5 hard) in the background so the first game using this category has
// questions ready instantly — no AI wait time.
//
// Invocation:
//   POST https://<project>.supabase.co/functions/v1/prewarm-category
//   Body: { categoryId: string, categoryName: string }
//   Auth: service_role key (never call this from the client)
//
// Deploy:
//   supabase functions deploy prewarm-category
// ─────────────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SEED_CONFIG = [
  { difficulty: 'easy',   count: 5 },
  { difficulty: 'medium', count: 5 },
  { difficulty: 'hard',   count: 5 },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { categoryId, categoryName } = await req.json()
    if (!categoryId || !categoryName) {
      return new Response(JSON.stringify({ error: 'Missing categoryId or categoryName' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[prewarm] Starting pre-warm for category: "${categoryName}" (${categoryId})`)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

    let totalInserted = 0
    const errors: string[] = []

    for (const { difficulty, count } of SEED_CONFIG) {
      try {
        const nonce = Math.random().toString(36).substring(7)
        const prompt = `
          أنت خبير مسابقات. كود: ${nonce}.
          ولّد ${count} أسئلة تمهيدية لفئة "${categoryName}" بمستوى صعوبة "${difficulty}".
          القواعد: تنوع عالٍ، عربية فصحى، JSON فقط:
          [{"question": "...", "answer": "...", "difficulty": "${difficulty}"}]
        `

        // Retry up to 2 times for pre-warming
        let text = ''
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const result = await model.generateContent(prompt)
            text = (await result.response).text()
            break
          } catch (err) {
            if (attempt === 2) throw err
            await new Promise(r => setTimeout(r, 1000))
          }
        }

        // Parse JSON
        const start = text.indexOf('[')
        const end = text.lastIndexOf(']')
        if (start === -1 || end === -1) throw new Error('No JSON in response')
        const questions = JSON.parse(text.substring(start, end + 1))

        // Insert into questions table
        const inserts = questions.map((q: any) => ({
          category_id: categoryId,
          difficulty: q.difficulty || difficulty,
          question: String(q.question).slice(0, 500),
          answer: String(q.answer).slice(0, 500),
        }))

        const { data, error } = await supabase
          .from('questions')
          .insert(inserts)
          .select('id')

        if (error) throw error
        totalInserted += (data ?? []).length
        console.log(`[prewarm] Inserted ${(data ?? []).length} ${difficulty} questions`)

      } catch (err: any) {
        console.error(`[prewarm] Failed for ${difficulty}:`, err.message)
        errors.push(`${difficulty}: ${err.message}`)
      }
    }

    // Create admin notification about pre-warm completion
    await supabase.from('admin_notifications').insert({
      type: totalInserted > 0 ? 'success' : 'warning',
      title: `تمهيد الفئة: ${categoryName}`,
      message: totalInserted > 0
        ? `تم توليد ${totalInserted} سؤال تمهيدي للفئة الجديدة "${categoryName}". الفئة جاهزة للاستخدام.`
        : `فشل توليد أسئلة تمهيدية للفئة "${categoryName}". ${errors.join('; ')}`,
      action_url: '/admin/questions',
    })

    console.log(`[prewarm] Done. Total inserted: ${totalInserted}`)

    return new Response(JSON.stringify({ totalInserted, errors }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err: any) {
    console.error('[prewarm] Fatal error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
