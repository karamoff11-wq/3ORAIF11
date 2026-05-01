# 📜 Abu Al-Areef Trivia — Project Context for AI Assistants

This document provides a quick overview for any AI assistant working on this project.

## 🚀 Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **State Management:** Zustand (see `store/gameStore.ts`)
- **Backend:** Supabase (PostgreSQL, Realtime)
- **Animations:** Framer Motion
- **Styling:** Vanilla CSS / Tailwind (mostly custom CSS in `globals.css`)

## 🎮 Core Gameplay Mechanisms (The "Addiction Loop")
We have implemented a high-engagement loop based on:
1. **Tension:** A 30s timer that pulses red and shakes the modal in the last 3 seconds, with an accelerated tick sound.
2. **Suspense:** A 0.7s "Thinking/Freeze" state after clicking "Reveal Answer" to build anticipation.
3. **Reward:** Randomized Arabic social humor messages (from `utils/humor.ts`) and dynamic sound effects (from `hooks/useSoundSystem.ts`).
4. **Social Humor:** Culturally relevant Arabic slang reactions for correct/wrong answers.
5. **Team Streaks:** Visual fire icons (🔥) on the scoreboard for consecutive correct answers.

## 📂 Key Files
- `components/QuestionModal.tsx`: The heart of the question gameplay logic.
- `store/gameStore.ts`: Global state including team scores, streaks, and game phases.
- `utils/humor.ts`: Dictionary of Arabic reactions.
- `hooks/useSoundSystem.ts`: Web Audio API implementation for gameplay sounds.
- `supabase/seed.sql`: Professional trivia dataset (500+ questions, 19 categories).

## 🛠️ Current Status
- The "Addiction Loop" is fully implemented.
- The database has been populated with a high-quality pro trivia dataset.
- The UI is responsive and uses premium aesthetics (glassmorphism, particle fields).

## 💡 Instructions for New AIs
- Always check `store/gameStore.ts` for state changes before modifying UI.
- Use `framer-motion` for all interactive transitions.
- Maintain the "Premium" look: avoid generic colors; use gradients and micro-animations.
- When adding questions, ensure they follow the `seed.sql` format and have assigned difficulties.
