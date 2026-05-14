/**
 * lib/aiService.ts  (Tier 3.2 upgrade)
 * ─────────────────────────────────────────────────────────────────────
 * 3.2 — AI Generation Retry + Fallback System
 *
 * Changes vs original:
 *  - generateNewQuestions now retries up to 3 times with exponential backoff
 *    (delays: 1s → 2s → 4s) before giving up
 *  - On total failure, falls back to pulling questions from the static DB
 *    bank (no AI, just existing questions for that category)
 *  - Returns a `{ questions, fromCache }` object so the caller knows
 *    whether AI or fallback was used
 *  - generateEmbeddings retries once on failure before returning null
 * ─────────────────────────────────────────────────────────────────────
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// ── Types ─────────────────────────────────────────────────────────────
export interface GeneratedQuestion {
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface GenerationResult {
  questions: GeneratedQuestion[]
  usedFallback: boolean  // true = pulled from static DB, not Gemini
  attempts: number       // how many Gemini tries were made
  usage?: { input: number; output: number }
}

// ── Helpers ───────────────────────────────────────────────────────────
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function parseQuestionsFromText(text: string): GeneratedQuestion[] {
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array found in AI response')
  return JSON.parse(text.substring(start, end + 1))
}

// ── 3.2 Retry wrapper ─────────────────────────────────────────────────
async function callGeminiWithRetry(
  prompt: string,
  maxAttempts = 3
): Promise<{ text: string; attempts: number; usage?: { input: number; output: number } }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })
  let lastError: unknown

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      const usage = response.usageMetadata ? {
        input: response.usageMetadata.promptTokenCount,
        output: response.usageMetadata.candidatesTokenCount,
      } : undefined
      console.log(`[aiService] Gemini succeeded on attempt ${attempt}`)
      return { text, attempts: attempt, usage }
    } catch (err) {
      lastError = err
      console.warn(`[aiService] Gemini attempt ${attempt}/${maxAttempts} failed:`, err)
      if (attempt < maxAttempts) {
        const backoffMs = 1000 * Math.pow(2, attempt - 1) // 1s, 2s, 4s
        console.log(`[aiService] Retrying in ${backoffMs}ms...`)
        await sleep(backoffMs)
      }
    }
  }

  throw lastError
}

// ── Public API ────────────────────────────────────────────────────────

export async function generateEmbeddings(texts: string[]): Promise<number[][] | null> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' })

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const results = await Promise.all(texts.map(text => model.embedContent(text)))
      return results.map(r => r.embedding.values)
    } catch (error) {
      console.error(`[aiService] Embedding attempt ${attempt} failed:`, error)
      if (attempt < 2) await sleep(1000)
    }
  }
  return null
}

/**
 * Main generation function with retry + fallback.
 * Falls back to `fallbackFetch` if Gemini fails after all retries.
 */
export async function generateNewQuestions(
  categoryName: string,
  difficulty: string,
  count: number,
  exclude: string[] = [],
  fallbackFetch?: () => Promise<GeneratedQuestion[]>
): Promise<GenerationResult> {
  const nonce = Math.random().toString(36).substring(7)
  const excludePrompt = exclude.length > 0
    ? `\nتجنب تماماً تكرار هذه الأسئلة (سواء بالنص أو المضمون):\n${exclude.slice(-40).map(q => `- ${q}`).join('\n')}`
    : ''

  const prompt = `
    أنت خبير مسابقات متخصص. كود العملية: ${nonce}.
    المطلوب: توليد ${count} أسئلة لـ "${categoryName}".
    
    القواعد الصارمة:
    1. الصعوبة: ${difficulty}.
    2. التنوع العميق: ابحث في "التفاصيل الدقيقة" (Deep Cuts). لا تكتفِ بالأسئلة المشهورة. 
       - في الألعاب: اسأل عن أسماء الممثلين، تواريخ الإصدار، تفاصيل الخرائط، إحصائيات الأسلحة.
       - في الأعلام: اسأل عن معاني الرموز، تاريخ التغيير، ألوان محددة في زوايا معينة.
    3. التنسيق: JSON array حصراً: [{"question": "...", "answer": "...", "difficulty": "easy/medium/hard"}]
    4. اللغة: عربية فصحى سليمة.
    5. منع التكرار: ${excludePrompt}
    6. أجب بمصفوفة JSON فقط.
  `

  // ── Try Gemini with retries ───────────────────────────────────────
  try {
    const { text, attempts, usage } = await callGeminiWithRetry(prompt, 3)
    console.log('[aiService] Raw Response:', text.slice(0, 200))
    const questions = parseQuestionsFromText(text)
    return { questions, usedFallback: false, attempts, usage }
  } catch (geminiError) {
    console.error('[aiService] All Gemini attempts failed. Activating fallback:', geminiError)
  }

  // ── Fallback: use static DB questions ──────────────────────────────
  if (fallbackFetch) {
    try {
      const fallbackQuestions = await fallbackFetch()
      console.log(`[aiService] Fallback returned ${fallbackQuestions.length} questions`)
      return { questions: fallbackQuestions, usedFallback: true, attempts: 3 }
    } catch (fallbackError) {
      console.error('[aiService] Fallback also failed:', fallbackError)
    }
  }

  return { questions: [], usedFallback: false, attempts: 3 }
}
