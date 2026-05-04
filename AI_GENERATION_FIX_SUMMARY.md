# AI Trivia Generation: Issues & Fixes Summary

This document summarizes the issues found in the Abu Al-Areef Trivia AI engine and the definitive fixes applied. Use this to provide context to other AI assistants.

---

## 1. The Issues Identified

### A. Cross-Category Repetition (Parallel Conflict)
**Issue:** When a user selected multiple categories (e.g., Biology and History), the system generated questions for both at the same time. Since both requests were sent to the AI simultaneously, they didn't know about each other's results, leading the AI to return the same "common" questions for both.
**Fix:** Switched from `Promise.all` (parallel) to a `for...of` loop (serial) in `gameEngine.ts`. Category B now waits for Category A to finish and includes Category A's results in its "Exclude" list.

### B. Stale History Context
**Issue:** The system sent a random sample of history to the AI. This meant the AI often didn't see the questions from the *very last* session, leading to immediate repeats.
**Fix:** Implemented a chronological history system (`trivia_history_v2`). It now tracks the exact order of questions seen and always sends the **60 most recent** questions to the AI as context.

### C. Inconsistent Difficulty & Phrasing
**Issue:** Questions were either too hard or too easy, and the Arabic was robotic/formal. Answers were often too long (sentences).
**Fix:** Overhauled `aiService.ts` prompt. It now defines "Easy/Medium/Hard" strictly, mandates **1-3 word answers**, and requests **"Natural/Cinematic Arabic"** (اللغة البيضاء) used by TV game show hosts.

### D. Duplicate Database Entries
**Issue:** The `questions` table allowed multiple entries of the same text with different IDs.
**Fix:** Implemented **Fuzzy Deduplication** using text normalization (stripping punctuation/spaces). The API now uses `upsert` on `(category_id, question)` to ensure a unique text pool.

---

## 2. The Core Architecture (Final Code)

### File 1: `lib/aiService.ts` (The AI Engine)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateNewQuestions(categoryName: string, difficulty: string, count: number, excludeTexts: string[] = []) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 1.1, responseMimeType: 'application/json' }
  })
  // Always take the most recent 60 to prevent immediate repeats
  const recentExcludes = excludeTexts.slice(-60)
  const prompt = `... (Strict definitions for difficulty, 1-3 word answers, Cinematic Arabic) ...`
  // Returns validated JSON array
}
```

### File 2: `lib/gameEngine.ts` (The Logic & Memory)
```typescript
// Key Logic: Serial Category Processing
async function generateQuestions(sessionId: string) {
  const history = await loadHostHistory(supabase, hostId)
  const categoryResults = []
  for (const sc of cats) { // SERIAL LOOP
    const pool = await buildCategoryPool(supabase, sc.id, sc.name, teams.length, history)
    categoryResults.push({ categoryId: sc.id, pool })
    // history is updated in real-time inside buildCategoryPool
  }
}
```

### File 3: `app/api/generate-questions/route.ts` (The Bridge)
```typescript
export async function POST(req: Request) {
  // Validates input, calls aiService, and performs DB Upsert
  const { data } = await supabaseAdmin
    .from('questions')
    .upsert(inserts, { onConflict: 'category_id, question' })
}
```

---

## 3. How to maintain this
1. **Never use parallel generation** for categories if uniqueness is the priority.
2. **Always normalize text** before comparing for duplicates.
3. **Gemini 2.0 Flash** is preferred for its native JSON support and speed.
