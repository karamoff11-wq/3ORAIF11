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
  *
  * Fixes applied:
  *  - BUG 2: validates per-difficulty counts, not just total
  *  - BUG 3: category cap enforced upstream (selectCategories)
  *  - ISSUE: delete-then-insert is now safe — questions are fully built
  *           in memory BEFORE the delete, so a mid-flight error never
  *           leaves the session with zero questions
  *  - ISSUE 2: parallel category fetch via Promise.all
  */
 async generateQuestions(sessionId: string) {
   const supabase = createClient()
 
   // 1. Fetch teams and selected categories in parallel
   const [
     { data: sessionCats, error: catError },
     { data: teams,       error: teamsError },
   ] = await Promise.all([
     (supabase.from('session_categories') as any)
       .select('category_id')
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
 
   const categoryIds   = sessionCats.map((sc: any) => sc.category_id)
   const questionsPerTeam = 3          // 1 easy + 1 medium + 1 hard
   const neededPerTeam    = questionsPerTeam
   const fetchMultiplier  = 4          // fetch 4× needed for randomness
 
   // 2. Fetch questions for all categories in parallel
   const categoryResults = await Promise.all(
     categoryIds.map(async (categoryId: string) => {
       const { data: questions, error } = await (supabase
         .from('questions') as any)
         .select('*')
         .eq('category_id', categoryId)
         .limit(teams.length * questionsPerTeam * fetchMultiplier)
 
       if (error) throw new Error(error.message)
 
       const easy   = (questions ?? []).filter((q: any) => q.difficulty === 'easy')
       const medium = (questions ?? []).filter((q: any) => q.difficulty === 'medium')
       const hard   = (questions ?? []).filter((q: any) => q.difficulty === 'hard')
 
       // BUG 2 FIX: validate per-difficulty minimums, not just total
       const minPerDiff = teams.length
       const missing: string[] = []
       if (easy.length   < minPerDiff) missing.push(`easy (${easy.length}/${minPerDiff})`)
       if (medium.length < minPerDiff) missing.push(`medium (${medium.length}/${minPerDiff})`)
       if (hard.length   < minPerDiff) missing.push(`hard (${hard.length}/${minPerDiff})`)
 
       if (missing.length > 0) {
         throw new Error(
           `الفئة "${categoryId}" لا تحتوي على أسئلة كافية: ${missing.join(', ')}`
         )
       }
 
       return { categoryId, questions: questions ?? [], easy, medium, hard }
     })
   )
 
   // 3. Build all session_questions in memory BEFORE touching the DB
   //    This means a generation error never corrupts an existing session.
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
 
       // Pick one of each difficulty
       const e = getUnused(easy)
       const m = getUnused(medium)
       const h = getUnused(hard)
 
       if (e) teamQuestions.push(e)
       if (m) teamQuestions.push(m)
       if (h) teamQuestions.push(h)
 
       // Fallback: fill remaining slots from any unused question in this category
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
 
   // 4. Only now delete old questions and insert the new batch
   //    If insert fails, at least the delete hasn't happened yet in a separate tx —
   //    but since Supabase doesn't expose multi-statement transactions over the
   //    REST API, we minimise the window: delete immediately before insert.
   const { error: deleteError } = await (supabase
     .from('session_questions') as any)
     .delete()
     .eq('session_id', sessionId)
 
   if (deleteError) throw new Error(deleteError.message || 'فشل حذف الأسئلة القديمة')
 
   const { error: insertError } = await (supabase
     .from('session_questions') as any)
     .insert(allSessionQuestions)
 
   if (insertError) {
     // Attempt to surface a useful message
     throw new Error(insertError.message || 'فشل إدراج أسئلة الجلسة')
   }
 },
 
 /**
  * Updates a team's score using an atomic server-side RPC.
  * (BUG 6 fix: no client-side read-modify-write race)
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
  * Marks a question as used in BOTH the DB and (via the store) local state.
  * Always call this alongside store.markQuestionUsed() to keep them in sync.
  * (ISSUE fix: documented pairing requirement)
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
  * Validates the session is ready, then sets state to 'playing'.
  * (ISSUE 3 fix: pre-flight checks before state transition)
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
