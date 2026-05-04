# Trivia Engine Diagnostics: Server Logs & Analysis

Use this file to collect and present logs to troubleshoot the "Insufficient Questions" (لا توجد أسئلة كافية) error.

---

## 1. Key Questions for Diagnosis
When the error occurs, please look for these specific indicators in your server console:

1.  **Did Gemini respond?**
    -   Look for: `[aiService] Raw response length: ...`
    -   If not found: Gemini API call might be failing silently or timing out.

2.  **Were questions rejected?**
    -   Look for: `[aiService] Rejected: empty field` or `[aiService] Rejected (answer too long after salvage)`
    -   If found: The AI is providing answers that don't meet our criteria (even with our new salvage logic).

3.  **How many attempts were made?**
    -   Look for: `[GameEngine] Astronomy attempt 1/3`, `2/3`, etc.
    -   If it stops at 1: The engine is crashing early.

4.  **Database check?**
    -   Look for: `[generate-questions] DB upsert error`
    -   If found: The generated questions are fine, but the database is failing to save them.

---

## 2. Diagnostic Script (Force Test)
Run this script to test "Astronomy" generation directly and see the logs. 

**Instructions:**
1. Create a file named `scratch/test-astronomy.ts`.
2. Paste the following code.
3. Run with `npx ts-node scratch/test-astronomy.ts`.

```typescript
import { generateNewQuestions } from '../lib/aiService';

async function test() {
  console.log('--- STARTING DIAGNOSTIC TEST: Astronomy ---');
  try {
    const questions = await generateNewQuestions('Astronomy', 'easy', 5, []);
    console.log('Final Result Count:', questions.length);
    if (questions.length > 0) {
      console.log('Sample Question:', questions[0].question);
      console.log('Sample Answer:', questions[0].answer);
    } else {
      console.error('FAILED: No questions returned.');
    }
  } catch (err) {
    console.error('CRITICAL ERROR:', err);
  }
}

test();
```

---

## 3. Current Code Reference
Ensure these files are in their latest version before diagnosing:
- `lib/aiService.ts` (with Salvage Logic)
- `lib/gameEngine.ts` (with Serial Processing)
- `app/api/generate-questions/route.ts` (with Upsert logic)
