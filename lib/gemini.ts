// lib/gemini.ts
import { getSpecialRules } from './categoryRules'

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`

const SYSTEM_PROMPT = `أنت نظام ذكاء اصطناعي متخصص حصرياً في توليد أسئلة مسابقات معلومات احترافية باللغة العربية الفصحى.

هويتك:
- لا تشرح، لا تعلّق، لا تقدّم، لا تودّع.
- مهمتك الوحيدة: إنتاج JSON صالح فقط.
- أي نص خارج JSON يُعدّ فشلاً كاملاً.

قواعد الجودة:
- العربية الفصحى السليمة في كل كلمة.
- لا تكرار في الأسئلة نهائياً.
- الأسئلة واضحة، مباشرة، قصيرة.
- الإجابات دقيقة ومختصرة.
- مستوى الصعوبة يُطبَّق بدقة:
  easy: معلومة يعرفها غالبية الناس
  medium: تحتاج معرفة جيدة أو تفكير
  hard: معلومة نادرة أو تفصيلية جداً`

interface Category {
  id: string
  name: string
  topicName?: string
  specialRules?: string
}

interface SessionConfig {
  sessionId: string
  teams: 2 | 3 | 4
  categories: Category[]
}

interface GeneratedQuestion {
  question: string
  answer: string
  difficulty: 'easy' | 'medium' | 'hard'
  category_id: string
}

function buildPrompt(teams: number, category: Category): string {
  const totalQuestions = teams * 3
  const specialRules = category.specialRules
    || getSpecialRules(category.name, category.topicName)

  return `المهمة: توليد أسئلة مسابقة.

عدد الفرق: ${teams}
الفئة: ${category.name}
الموضوع: ${category.topicName || 'غير محدد'}

المطلوب:
  - easy   → ${teams} سؤال
  - medium → ${teams} سؤال
  - hard   → ${teams} سؤال
  - المجموع: ${totalQuestions} سؤال

قواعد الفئة:
${specialRules}

تنسيق الإخراج — JSON فقط، بدون أي نص خارجه، بدون markdown:
[{"question":"","answer":"","difficulty":"easy"}]

ابدأ الآن.`
}

async function callGemini(prompt: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.75,
            topP: 0.92,
            topK: 40,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json'
          }
        })
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error.message)
      return data.candidates[0].content.parts[0].text

    } catch (err) {
      if (attempt === retries) throw err
      await new Promise(r => setTimeout(r, 800 * attempt))
    }
  }
  throw new Error('Gemini failed after all retries')
}

function parseResponse(raw: string, categoryId: string): GeneratedQuestion[] {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']') + 1
  if (start === -1 || end === 0) throw new Error('No JSON array in response')

  const parsed = JSON.parse(cleaned.slice(start, end))
  return parsed.map((q: any) => ({ ...q, category_id: categoryId }))
}

function validate(questions: GeneratedQuestion[], teams: number, categoryName: string) {
  const expected = teams * 3
  if (questions.length !== expected) {
    throw new Error(`${categoryName}: expected ${expected} questions, got ${questions.length}`)
  }

  const counts = { easy: 0, medium: 0, hard: 0 }
  for (const q of questions) {
    if (!['easy', 'medium', 'hard'].includes(q.difficulty)) {
      throw new Error(`Invalid difficulty: ${q.difficulty}`)
    }
    if (!q.question?.trim() || !q.answer?.trim()) {
      throw new Error('Empty question or answer found')
    }
    counts[q.difficulty as keyof typeof counts]++
  }

  if (counts.easy !== teams || counts.medium !== teams || counts.hard !== teams) {
    throw new Error(`${categoryName}: wrong difficulty distribution`)
  }

  const seen = new Set<string>()
  for (const q of questions) {
    const key = q.question.trim().toLowerCase()
    if (seen.has(key)) throw new Error(`Duplicate question: ${q.question}`)
    seen.add(key)
  }
}

export async function generateSession(config: SessionConfig): Promise<GeneratedQuestion[]> {
  const results = await Promise.allSettled(
    config.categories.map(async (cat) => {
      const prompt = buildPrompt(config.teams, cat)

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const raw = await callGemini(prompt)
          const questions = parseResponse(raw, cat.id)
          validate(questions, config.teams, cat.name)
          return questions
        } catch (err) {
          if (attempt === 3) throw err
          await new Promise(r => setTimeout(r, 800 * attempt))
        }
      }
      throw new Error(`Failed for category: ${cat.name}`)
    })
  )

  const allQuestions: GeneratedQuestion[] = []
  const failed: string[] = []

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      allQuestions.push(...result.value!)
    } else {
      failed.push(config.categories[i].name)
      console.error(`Category ${config.categories[i].name} failed:`, result.reason)
    }
  })

  if (failed.length > 0) {
    throw new Error(`Failed to generate questions for: ${failed.join(', ')}`)
  }

  return allQuestions
}
