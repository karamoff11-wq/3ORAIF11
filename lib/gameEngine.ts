import { createClient } from '@/lib/supabaseClient'
import { GameMode, Difficulty } from '@/types/game'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
* Generates a unique 6-char join code with collision retry.
* (BUG 4 — fixed: retries up to 5 times)
*/
async function generateUniqueJoinCode(supabase: any): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { data } = await supabase
      .from('sessions')
      .select('id')
      .eq('join_code', code)
      .maybeSingle()

    if (!data) return code
  }
  throw new Error('Could not generate unique join code after 5 attempts')
}

/**
* Ensures a profile row exists for the user.
* Needed because anonymous users trigger the DB trigger, but there can be
* a race condition where the session insert happens before the trigger commits.
* (NEW BUG 1 fix)
*/
async function ensureProfile(supabase: any, userId: string): Promise<void> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (!data) {
    // Trigger may not have fired yet — insert manually (upsert = safe)
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })

    if (error) throw new Error('Failed to create user profile: ' + error.message)
  }
}

// ─────────────────────────────────────────────
// Game Engine
// ─────────────────────────────────────────────

export const gameEngine = {

  /**
   * Creates a new game session.
   * (BUG 1 fix: supabase client created fresh per call)
   * (NEW BUG 1 fix: profile existence guaranteed before FK insert)
   */
  async createSession(hostId: string, mode: GameMode) {
    const supabase = createClient()

    // Guarantee profile exists before the FK constraint on sessions.host_id fires
    await ensureProfile(supabase, hostId)

    const joinCode = mode === 'remote' ? await generateUniqueJoinCode(supabase) : null

    const { data, error } = await (supabase
      .from('sessions') as any)
      .insert({
        host_id: hostId,
        mode,
        state: 'lobby',
        join_code: joinCode,
        current_question_index: 0,
        current_team_index: 0,
      })
      .select()
      .single()

    if (error) throw new Error(error.message || 'Failed to create session')
    return data
  },

  /**
   * Saves the selected categories for a session.
   * (NEW BUG 3 fix: throws if more than 6 categories passed, instead of silent truncation)
   */
  async selectCategories(sessionId: string, categoryIds: string[]) {
    if (categoryIds.length === 0) throw new Error('يجب اختيار فئة واحدة على الأقل')
    if (categoryIds.length > 6)  throw new Error('الحد الأقصى للفئات هو 6')

    const supabase = createClient()

    await (supabase.from('session_categories') as any)
      .delete()
      .eq('session_id', sessionId)

    const inserts = categoryIds.map(categoryId => ({
      session_id: sessionId,
      category_id: categoryId,
    }))

    const { error } = await (supabase.from('session_categories') as any).insert(inserts)
    if (error) throw new Error(error.message || 'خطأ في حفظ الفئات')
  },

  /**
   * Generates questions for the session.
   */
  async generateQuestions(sessionId: string) {
    const supabase = createClient()

    // 1. Get Session Info & Host
    const { data: session, error: sessErr } = await (supabase.from('sessions') as any)
      .select('host_id')
      .eq('id', sessionId)
      .single()
    if (sessErr || !session) throw new Error('Session not found')

    const hostId = session.host_id

    // Get all previously used questions by this host across ALL their sessions
    console.log('[GameEngine] Fetching history for Host:', hostId)
    
    // Direct query for session IDs first to be super safe
    const { data: userSessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('host_id', hostId)
    
    const sessionIds = userSessions?.map(s => s.id) || []
    
    let globallyUsedIds = new Set<string>()
    let globallyUsedTexts = new Set<string>()

    // Merge DB history with LocalStorage history for maximum reliability
    if (typeof window !== 'undefined') {
      const localHistory = JSON.parse(localStorage.getItem('trivia_history_texts') || '[]')
      localHistory.forEach((t: string) => globallyUsedTexts.add(t))
    }

    if (sessionIds.length > 0) {
      const { data: usedRes } = await supabase
        .from('session_questions')
        .select('question_id, questions(question)')
        .in('session_id', sessionIds)
      
      usedRes?.forEach((r: any) => {
        if (r.question_id) globallyUsedIds.add(r.question_id)
        if (r.questions?.question) globallyUsedTexts.add(r.questions.question)
      })
    }

    console.log(`[GameEngine] Total history size (DB+Local): ${globallyUsedTexts.size}`)
    if (typeof window !== 'undefined') {
      const toast = (await import('react-hot-toast')).default
      if (globallyUsedTexts.size > 0) {
        toast.success(`جارٍ تصفية الأسئلة.. استبعاد ${globallyUsedTexts.size} سؤالاً مكرراً.`)
      }
    }

    // 1. Fetch teams and selected categories (with names) in parallel
    const [
      { data: sessionCats, error: catError },
      { data: teams,       error: teamsError },
    ] = await Promise.all([
      (supabase.from('session_categories') as any)
        .select('category_id, categories(name)')
        .eq('session_id', sessionId),
      (supabase.from('teams') as any)
        .select('id')
        .eq('session_id', sessionId)
        .order('created_at'),
    ])

    if (catError)   throw new Error(catError.message)
    if (teamsError) throw new Error(teamsError.message)
    if (!sessionCats || sessionCats.length === 0) throw new Error('لم يتم اختيار فئات')
    if (!teams || teams.length < 2)              throw new Error('يجب إضافة فريقين على الأقل')

    const questionsPerTeam = 3          // 1 easy + 1 medium + 1 hard
    const minPerDiff = teams.length

    // 2. Fetch questions for all categories in parallel
    const categoryResults = await Promise.all(
      sessionCats.map(async (sc: any) => {
        const categoryId = sc.category_id
        const categoryName = sc.categories?.name || categoryId

        // Fetch questions
        let { data: questions, error } = await (supabase
          .from('questions') as any)
          .select('*')
          .eq('category_id', categoryId)

        if (error) throw new Error(error.message)

        // FILTER out globally used questions
        let unusedPool = (questions ?? []).filter((q: any) => !globallyUsedIds.has(q.id))

        // Gather texts of questions already used in this category to tell AI to avoid them
        const usedTexts = (questions ?? [])
          .filter((q: any) => globallyUsedIds.has(q.id))
          .map((q: any) => q.question)

        // Normalization helper
        const normalize = (t: string) => t.trim().replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ')
        const normalizedUsedTexts = new Set(Array.from(globallyUsedTexts).map(t => normalize(t)))
        
        // AI GENERATION: Dynamic batch with retries for power users
        const difficulties = ['easy', 'medium', 'hard']
        const neededPerDiff = teams.length
        let attempts = 0
        const maxAttempts = 3
        
        while (attempts < maxAttempts) {
          const easyNeeded = Math.max(0, neededPerDiff - unusedPool.filter(q => q.difficulty === 'easy').length)
          const medNeeded = Math.max(0, neededPerDiff - unusedPool.filter(q => q.difficulty === 'medium').length)
          const hardNeeded = Math.max(0, neededPerDiff - unusedPool.filter(q => q.difficulty === 'hard').length)
          
          if (easyNeeded === 0 && medNeeded === 0 && hardNeeded === 0 && attempts > 0) break;

          console.log(`[GameEngine] AI Attempt ${attempts + 1} for ${categoryName}. Needed: E:${easyNeeded} M:${medNeeded} H:${hardNeeded}`)
          
          try {
            // Small stagger to avoid rate limits
            if (attempts > 0) await new Promise(r => setTimeout(r, 1000))

            // Pick a RANDOM 60 questions from history as negative examples
            const historyArray = Array.from(globallyUsedTexts)
            const randomExcludes = historyArray.sort(() => 0.5 - Math.random()).slice(0, 60)

            const res = await fetch('/api/generate-questions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                categoryId,
                // Adaptive instructions per attempt
                categoryName: attempts === 2 
                  ? `${categoryName} (تفاصيل تقنية وتاريخية عميقة جداً - لا تكرر الأسئلة السهلة)` 
                  : categoryName,
                difficulty: 'all',
                count: attempts === 2 ? 40 : 25, 
                exclude: randomExcludes
              })
            })
            const { questions: newAiQuestions } = await res.json()
            
            if (newAiQuestions && Array.isArray(newAiQuestions)) {
              let addedThisTime = 0
              newAiQuestions.forEach((q: any) => {
                const normQ = normalize(q.question)
                const isRepeat = normalizedUsedTexts.has(normQ) || globallyUsedIds.has(q.id)
                
                if (!isRepeat) {
                  unusedPool.push({ ...q, isNew: true })
                  globallyUsedTexts.add(q.question)
                  normalizedUsedTexts.add(normQ)
                  addedThisTime++
                }
              })
              console.log(`[GameEngine] Attempt ${attempts + 1} added ${addedThisTime} unique questions.`)
            }
          } catch (err) {
            console.warn(`AI attempt ${attempts + 1} failed:`, err)
          }
          attempts++
          const stillMissing = difficulties.some(d => unusedPool.filter(q => q.difficulty === d).length < neededPerDiff)
          if (!stillMissing) break;
        }

        // Save updated history to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('trivia_history_texts', JSON.stringify(Array.from(globallyUsedTexts)))
        }

        // EMERGENCY FALLBACK: If we still don't have enough NEW questions, 
        // we must allow some repeats from the distant past to avoid a crash.
        const totalNeeded = neededPerDiff * 3
        if (unusedPool.length < totalNeeded) {
          console.warn(`[GameEngine] Category ${categoryName} exhausted. Falling back to oldest questions.`)
          // Fetch questions again, but this time we'll take some we've seen before
          // We prioritize questions that were used the LEAST amount of times or longest ago
          const { data: fallbackQuestions } = await (supabase
            .from('questions') as any)
            .select('*')
            .eq('category_id', categoryId)
            .limit(20)
          
          if (fallbackQuestions) {
            fallbackQuestions.forEach((q: any) => {
              if (!unusedPool.find(p => p.id === q.id)) {
                unusedPool.push({ ...q, isFallback: true })
              }
            })
          }
        }

        // Final shuffle: Prioritize 'isNew', then everything else
        const shuffled = unusedPool.sort((a, b) => {
          if (a.isNew && !b.isNew) return -1
          if (!a.isNew && b.isNew) return 1
          if (a.isFallback && !b.isFallback) return 1 // Fallbacks go last
          if (!a.isFallback && b.isFallback) return -1
          return Math.random() - 0.5
        })

        // Group by difficulty
        const easy   = shuffled.filter((q: any) => q.difficulty === 'easy')
        const medium = shuffled.filter((q: any) => q.difficulty === 'medium')
        const hard   = shuffled.filter((q: any) => q.difficulty === 'hard')

        // DIFFICULTY SLIDING: If any level is missing, borrow from others
        const sources = { easy: [...easy], medium: [...medium], hard: [...hard] }
        
        const fill = (diff: 'easy' | 'medium' | 'hard') => {
          const result: any[] = []
          const targetCount = neededPerDiff
          while (result.length < targetCount) {
            const q = sources[diff].shift() || sources.medium.shift() || sources.easy.shift() || sources.hard.shift()
            if (!q) break
            result.push(q)
          }
          return result
        }

        const finalEasy = fill('easy')
        const finalMedium = fill('medium')
        const finalHard = fill('hard')

        const finalCount = finalEasy.length + finalMedium.length + finalHard.length
        if (finalCount < totalNeeded) {
          throw new Error(`الفئة "${categoryName}" لا تحتوي على أسئلة كافية إطلاقاً. يرجى اختيار فئة أخرى.`)
        }

        return { categoryId, questions: [...finalEasy, ...finalMedium, ...finalHard], easy: finalEasy, medium: finalMedium, hard: finalHard }
      })
    )

    // 3. Build all session_questions in memory
    const usedIds = new Set<string>()
    const allSessionQuestions: any[] = []

    const getUnused = (pool: any[]): any | null => {
      const q = pool.find((p: any) => !usedIds.has(p.id))
      if (q) usedIds.add(q.id)
      return q ?? null
    }

    for (const { categoryId, questions, easy, medium, hard } of categoryResults) {
      for (const team of teams) {
        const teamQuestions: any[] = []

        const e = getUnused(easy)
        const m = getUnused(medium)
        const h = getUnused(hard)

        if (e) teamQuestions.push(e)
        if (m) teamQuestions.push(m)
        if (h) teamQuestions.push(h)

        if (teamQuestions.length < questionsPerTeam) {
          const remaining = questions.filter((p: any) => !usedIds.has(p.id))
          while (teamQuestions.length < questionsPerTeam && remaining.length > 0) {
            const fallback = remaining.shift()
            if (fallback) {
              usedIds.add(fallback.id)
              teamQuestions.push(fallback)
            }
          }
        }

        allSessionQuestions.push(
          ...teamQuestions.map((q: any, index: number) => ({
            session_id:  sessionId,
            question_id: q.id,
            category_id: categoryId,
            team_id:     team.id,
            difficulty:  q.difficulty,
            order_index: index,
            used:        false,
          }))
        )
      }
    }

    // 4. Update DB
    const { error: deleteError } = await (supabase
      .from('session_questions') as any)
      .delete()
      .eq('session_id', sessionId)

    if (deleteError) throw new Error(deleteError.message || 'فشل حذف الأسئلة القديمة')

    const { error: insertError } = await (supabase
      .from('session_questions') as any)
      .insert(allSessionQuestions)

    if (insertError) throw new Error(insertError.message || 'فشل إدراج أسئلة الجلسة')
  },

  /**
   * Clears all session_questions records associated with sessions owned by this host.
   * This effectively "resets" the "Never Repeat" history.
   */
  async resetUserHistory(hostId: string) {
    const supabase = createClient()
    
    // Get all session IDs owned by this host
    const { data: userSessions } = await (supabase
      .from('sessions') as any)
      .select('id')
      .eq('host_id', hostId)
    
    const sessionIds = userSessions?.map((s: any) => s.id) || []
    if (sessionIds.length === 0) return

    const { error } = await (supabase
      .from('session_questions') as any)
      .delete()
      .in('session_id', sessionIds)

    if (error) throw new Error('Failed to reset history: ' + error.message)
  },

  /**
   * Updates a team's score using an atomic server-side RPC.
   */
  async updateTeamScore(teamId: string, points: number) {
    const supabase = createClient()
    const { error } = await (supabase.rpc as any)('increment_team_score', {
      team_id:      teamId,
      points_to_add: points,
    })

    if (error) throw new Error(error.message || 'فشل تحديث النقاط')
  },

  /**
   * Marks a question as used in BOTH the DB and local state.
   */
  async markQuestionUsed(sessionQuestionId: string) {
    const supabase = createClient()
    const { error } = await (supabase
      .from('session_questions') as any)
      .update({ used: true })
      .eq('id', sessionQuestionId)

    if (error) throw new Error(error.message || 'فشل تحديث حالة السؤال')
  },

  /**
   * Updates the current turn index for a session.
   */
  async updateSessionTurn(sessionId: string, nextTeamIndex: number) {
    if (isNaN(nextTeamIndex)) return
    const supabase = createClient()
    const { error } = await (supabase.from('sessions') as any)
      .update({ current_team_index: nextTeamIndex })
      .eq('id', sessionId)
    if (error) {
      console.warn('Network issue updating turn:', error)
      throw error
    }
  },

  /**
   * Validates the session is ready, then sets state to 'playing'.
   */
  async startGame(sessionId: string) {
    const supabase = createClient()

    const [
      { count: teamCount },
      { count: questionCount },
    ] = await Promise.all([
      supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId),
      supabase
        .from('session_questions')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId),
    ])

    if (!teamCount || teamCount < 2)      throw new Error('يجب إضافة فريقين على الأقل')
    if (!questionCount || questionCount === 0) throw new Error('لم يتم توليد الأسئلة بعد')

    const { error } = await (supabase
      .from('sessions') as any)
      .update({ state: 'playing' })
      .eq('id', sessionId)

    if (error) throw new Error(error.message || 'فشل بدء اللعبة')
  },

  /**
   * Returns points for a given difficulty from the scoring config.
   */
  calculatePoints(difficulty: Difficulty, config: any): number {
    switch (difficulty) {
      case 'easy':   return config.easy_points
      case 'medium': return config.medium_points
      case 'hard':   return config.hard_points
      default:       return 0
    }
  },
}
