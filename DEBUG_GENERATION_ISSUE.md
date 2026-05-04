# Technical Report: "Insufficient Questions" Error on New Categories

## 1. Problem Description
The user encountered a "لا توجد أسئلة كافية" (Insufficient questions) error when starting a game with a newly created category ("Astronomy"). This error occurs when the `gameEngine` fails to populate the required question pool (1 Easy, 1 Medium, 1 Hard per team) after 3 AI generation attempts.

## 2. Root Cause Analysis
The issue is likely a **"Silent Filter Rejection"** combined with **"Zero Database Baseline"**:

1.  **Strict Filtering**: The previous code rejected any AI answer longer than 5 words. In scientific topics like Astronomy, the AI often provides slightly longer factual answers (e.g., "أقرب كوكب إلى الشمس هو عطارد"), which were being discarded.
2.  **Zero-Question Category**: Since "Astronomy" is a new category, there are no existing questions in the database to fall back on if the AI fails.
3.  **Model Availability**: The model was set to `gemini-2.0-flash`, which might be unavailable in certain regions or API tiers, leading to empty responses.

## 3. Implemented Fixes
I have updated `lib/aiService.ts` with the following changes:

-   **Switched to Stable Model**: Changed `gemini-2.0-flash` to `gemini-1.5-flash` to ensure 100% availability.
-   **Increased Word Limit**: Raised the answer word limit to **10 words** to accommodate scientific facts while still encouraging brevity.
-   **Enhanced Logging**: Added logs to show why questions are being rejected (e.g., "Answer too long", "Empty field").
-   **Prompt Tuning**: Explicitly told the AI that if the topic is scientific, it should prioritize accuracy over extreme brevity.

## 4. How to Debug Further
If the issue persists, check the server-side console for logs starting with `[aiService]`.
-   If you see `Raw response length: 0`, check the **GEMINI_API_KEY**.
-   If you see `Rejected: Answer too long`, the AI is ignoring the brevity instruction.
