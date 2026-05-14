import { NextResponse } from 'next/server'
import { generateNewQuestions, generateEmbeddings } from '@/lib/aiService'
import { createClient, createAdminClient } from '@/lib/supabaseServer'
import { checkRateLimit, GENERATE_QUESTIONS_LIMIT, IP_BURST_LIMIT } from '@/lib/security/rateLimit'
import { sanitizeCategoryName, sanitizeText, SanitizationError } from '@/lib/security/sanitize'
import { logAdminAction } from '@/lib/security/auditLog'
import { getCachedQuestionIds, cacheQuestionIds } from '@/lib/cache/questionCache'

export async function POST(req: Request) {
  try {
    // ── 1. Identify caller ──────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'
    const rateLimitKey = user?.id ?? ip

    // ── 2. Rate limiting ────────────────────────────────────────────────────
    const ipResult = checkRateLimit(ip, 'generate-questions-ip', IP_BURST_LIMIT)
    if (!ipResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before generating more questions.' },
        { status: 429, headers: { 'Retry-After': String(ipResult.retryAfter) } }
      )
    }

    const userResult = checkRateLimit(rateLimitKey, 'generate-questions-user', GENERATE_QUESTIONS_LIMIT)
    if (!userResult.success) {
      return NextResponse.json(
        { error: `حد إنشاء الأسئلة الساعي مكتمل. يُرجى الانتظار ${userResult.retryAfter} ثانية.` },
        { status: 429, headers: { 'Retry-After': String(userResult.retryAfter) } }
      )
    }

    // ── 3. Parse & sanitise input ───────────────────────────────────────────
    let body: Record<string, unknown>
    try { body = await req.json() }
    catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }

    const { categoryId, difficulty, count, exclude } = body

    let categoryName: string
    try {
      categoryName = sanitizeCategoryName(body.categoryName)
    } catch (err) {
      if (err instanceof SanitizationError) {
        return NextResponse.json({ error: err.message }, { status: 400 })
      }
      throw err
    }

    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json({ error: 'Missing required field: categoryId' }, { status: 400 })
    }
    if (!categoryName) {
      return NextResponse.json({ error: 'Missing required field: categoryName' }, { status: 400 })
    }
    if (!difficulty || !['easy', 'medium', 'hard'].includes(String(difficulty))) {
      return NextResponse.json({ error: 'Invalid difficulty' }, { status: 400 })
    }

    const safeCount = Math.min(Math.max(Number(count) || 3, 1), 20)
    const safeExclude = Array.isArray(exclude)
      ? exclude.filter(e => typeof e === 'string').slice(0, 500)
      : []

    const UUID_RE = /^[0-9a-f-]{36}$/i
    if (!UUID_RE.test(String(categoryId))) {
      return NextResponse.json({ error: 'Invalid categoryId format' }, { status: 400 })
    }

    const supabaseAdmin = createAdminClient()

    // ── 4. CACHE CHECK (3.1) ────────────────────────────────────────────────
    const cachedIds = await getCachedQuestionIds(String(categoryId), String(difficulty))
    if (cachedIds && cachedIds.length >= safeCount) {
      // We have enough cached IDs — fetch those questions from DB (no AI call!)
      const shuffled = cachedIds.sort(() => Math.random() - 0.5).slice(0, safeCount)
      const { data: cachedQuestions } = await (supabaseAdmin
        .from('questions') as any)
        .select('*')
        .in('id', shuffled)

      if (cachedQuestions && cachedQuestions.length >= safeCount) {
        console.log(`[generate-questions] ✅ Cache HIT — skipping Gemini for "${categoryName}"`)
        return NextResponse.json({
          questions: cachedQuestions,
          remaining: userResult.remaining,
          fromCache: true,
        })
      }
    }

    // ── 5. Generate questions with AI (3.2 retry + fallback) ───────────────
    console.log(`[generate-questions] 🤖 Calling Gemini: ${String(difficulty)}×${safeCount} for "${categoryName}"`)

    const startTimeMs = Date.now()
    
    // Fallback: pull existing questions from DB if Gemini fails
    const fallbackFetch = async () => {
      const { data: existing } = await (supabaseAdmin
        .from('questions') as any)
        .select('question, answer, difficulty')
        .eq('category_id', String(categoryId))
        .eq('difficulty', String(difficulty))
        .limit(safeCount * 2)
        .order('created_at', { ascending: false })

      return (existing ?? []).slice(0, safeCount)
    }

    const { questions: newQuestions, usedFallback, attempts, usage } = await generateNewQuestions(
      categoryName,
      String(difficulty),
      safeCount,
      safeExclude,
      fallbackFetch
    )
    
    const latencyMs = Date.now() - startTimeMs

    if (newQuestions.length === 0) {
      return NextResponse.json({ error: 'Failed to generate questions' }, { status: 500 })
    }

    // If we used the DB fallback, return directly (no re-insert)
    if (usedFallback) {
      console.log(`[generate-questions] ⚠️ Used DB fallback after ${attempts} Gemini attempts`)
      return NextResponse.json({
        questions: newQuestions,
        remaining: userResult.remaining,
        fromCache: false,
        usedFallback: true,
        warning: 'AI assistance unavailable — using curated questions instead.',
      })
    }

    // ── 6. Generate embeddings ──────────────────────────────────────────────
    const textsToEmbed = newQuestions.map((q: any) => `${q.question} الإجابة: ${q.answer}`)
    const embeddings = await generateEmbeddings(textsToEmbed)

    // ── 7. Insert into DB ───────────────────────────────────────────────────
    const inserts = newQuestions.map((q: any, i: number) => ({
      category_id: String(categoryId),
      difficulty: q.difficulty || String(difficulty),
      question: sanitizeText(q.question, { maxLength: 500, label: 'question' }),
      answer: sanitizeText(q.answer, { maxLength: 500, label: 'answer' }),
      embedding: embeddings && embeddings[i] ? `[${embeddings[i].join(',')}]` : null,
    }))

    const { data, error } = await (supabaseAdmin
      .from('questions') as any)
      .insert(inserts)
      .select()

    if (error) {
      // 3.3: If the deduplication trigger fires, return a friendly message
      if (error.message?.includes('DUPLICATE_QUESTION')) {
        console.warn('[generate-questions] Duplicate question blocked by DB trigger')
        return NextResponse.json(
          { error: 'بعض الأسئلة المُولَّدة مكررة وتم رفضها. حاول مرة أخرى.' },
          { status: 409 }
        )
      }
      console.error('[generate-questions] DB Insert Error:', error)
      return NextResponse.json({ error: 'Failed to save questions to DB', details: error }, { status: 500 })
    }

    // ── 8. Update cache with new IDs (3.1) ─────────────────────────────────
    const newIds = (data ?? []).map((q: any) => q.id as string).filter(Boolean)
    if (newIds.length > 0) {
      await cacheQuestionIds(String(categoryId), String(difficulty), newIds)
    }

    // ── 8.5 Log AI Usage (4.2) ───────────────────────────────────────────────
    if (!usedFallback && usage) {
      await (supabaseAdmin.from('ai_usage_log') as any).insert({
        model: 'gemini-flash-latest',
        input_tokens: usage.input,
        output_tokens: usage.output,
        latency_ms: latencyMs,
        category_id: String(categoryId),
        used_fallback: false,
        used_cache: false,
      }).catch((err: any) => console.warn('[generate-questions] Failed to log AI usage:', err))
    }

    // ── 9. Audit log ────────────────────────────────────────────────────────
    if (user?.id) {
      await logAdminAction({
        admin_id: user.id,
        action: 'generate_questions_ai',
        target_id: String(categoryId),
        payload: { categoryName, difficulty, count: newQuestions.length, geminiAttempts: attempts },
      })
    }

    return NextResponse.json({
      questions: data,
      remaining: userResult.remaining,
      fromCache: false,
      usedFallback: false,
    })

  } catch (error: any) {
    console.error('[generate-questions] Unhandled error:', error)
    return NextResponse.json({ error: error.message ?? 'Internal server error' }, { status: 500 })
  }
}
