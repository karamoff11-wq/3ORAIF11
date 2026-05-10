import { createClient } from '@/lib/supabaseServer'
import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/game/submit-answer
 *
 * Server-Authoritative scoring endpoint.
 * The CLIENT only sends: { sessionQuestionId, teamId }
 * The SERVER validates the question, calculates points from the DB scoring config,
 * and atomically updates the score. The client cannot manipulate points.
 */
export async function POST(request: NextRequest) {
  // 1. Authenticate the user — reject anonymous requests
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse body — only trust minimal inputs
  let body: { sessionQuestionId?: string; teamId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { sessionQuestionId, teamId } = body

  if (!sessionQuestionId || !teamId) {
    return NextResponse.json({ error: 'Missing sessionQuestionId or teamId' }, { status: 400 })
  }

  // 3. Fetch the session question — server-side validation
  const { data: sq, error: sqError } = await (supabase
    .from('session_questions') as any)
    .select('id, used, difficulty, session_id, question_id')
    .eq('id', sessionQuestionId)
    .single()

  if (sqError || !sq) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }

  // 4. Guard: prevent duplicate scoring (idempotency)
  if (sq.used) {
    return NextResponse.json({ error: 'Question already answered', alreadyUsed: true }, { status: 409 })
  }

  // 5. Validate the team belongs to the same session
  const { data: team, error: teamError } = await (supabase
    .from('teams') as any)
    .select('id, session_id, score')
    .eq('id', teamId)
    .single()

  if (teamError || !team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 })
  }

  if (team.session_id !== sq.session_id) {
    return NextResponse.json({ error: 'Team does not belong to this session' }, { status: 403 })
  }

  // 6. Validate the user is the host of this session
  const { data: session, error: sessionError } = await (supabase
    .from('sessions') as any)
    .select('host_id, current_team_index, state')
    .eq('id', sq.session_id)
    .single()

  if (sessionError || !session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  if (session.host_id !== user.id) {
    return NextResponse.json({ error: 'Only the host can submit answers' }, { status: 403 })
  }

  if (session.state !== 'playing') {
    return NextResponse.json({ error: 'Game is not in playing state' }, { status: 400 })
  }

  // 7. Fetch scoring config from DB — server decides the points
  const { data: scoringConfig } = await (supabase
    .from('scoring_config') as any)
    .select('easy_points, medium_points, hard_points')
    .limit(1)
    .single()

  const config = scoringConfig ?? { easy_points: 100, medium_points: 200, hard_points: 300 }

  const pointsMap: Record<string, number> = {
    easy:   config.easy_points,
    medium: config.medium_points,
    hard:   config.hard_points,
  }
  const pointsToAward = pointsMap[sq.difficulty] ?? 100

  // 8. Atomic operations: mark used + award points + advance turn
  const totalTeams = await (supabase
    .from('teams') as any)
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sq.session_id)

  const teamCount = totalTeams.count ?? 2
  const nextTeamIndex = (session.current_team_index + 1) % teamCount

  // Run all three DB mutations in parallel
  const [markResult, scoreResult, turnResult] = await Promise.all([
    // Mark question as used
    (supabase
      .from('session_questions') as any)
      .update({ used: true })
      .eq('id', sessionQuestionId),

    // Atomically increment score using server-side RPC
    (supabase.rpc as any)('increment_team_score', {
      team_id:       teamId,
      points_to_add: pointsToAward,
    }),

    // Advance turn
    (supabase
      .from('sessions') as any)
      .update({ current_team_index: nextTeamIndex })
      .eq('id', sq.session_id),
  ])

  if (markResult.error)  console.error('[submit-answer] mark used error:', markResult.error)
  if (scoreResult.error) console.error('[submit-answer] score RPC error:',  scoreResult.error)
  if (turnResult.error)  console.error('[submit-answer] turn update error:', turnResult.error)

  // 9. Return the authoritative result to the client
  return NextResponse.json({
    success:       true,
    pointsAwarded: pointsToAward,
    nextTeamIndex,
    teamId,
  })
}
