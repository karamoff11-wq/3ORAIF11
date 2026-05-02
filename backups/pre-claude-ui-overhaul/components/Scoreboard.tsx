'use client'
import { motion } from 'framer-motion'

interface Team { id: string; name: string; color: string; score: number }
interface Props { teams: Team[]; currentTeamId: string }

export default function Scoreboard({ teams, currentTeamId }: Props) {
  const sorted = [...teams].sort((a, b) => b.score - a.score)
  const maxScore = Math.max(...teams.map(t => t.score), 1)
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="w-full flex flex-col gap-2">
      {sorted.map((team, i) => {
        const isActive = team.id === currentTeamId
        const barWidth = maxScore > 0 ? (team.score / maxScore) * 100 : 0
        return (
          <motion.div
            key={team.id}
            layout
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300"
            style={{
              background: isActive ? `${team.color}12` : 'rgba(255,255,255,0.03)',
              border: isActive ? `1px solid ${team.color}35` : '1px solid rgba(255,255,255,0.05)',
              boxShadow: isActive ? `0 0 24px ${team.color}18` : 'none',
            }}
          >
            {/* Medal / rank */}
            <span className="text-base w-6 text-center shrink-0">
              {medals[i] ?? <span className="text-xs font-black text-white/30">#{i + 1}</span>}
            </span>

            {/* Color dot */}
            <div className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: team.color, boxShadow: isActive ? `0 0 8px ${team.color}` : 'none' }} />

            {/* Name + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold truncate flex items-center gap-2"
                  style={{ color: isActive ? team.color : 'rgba(255,255,255,0.75)' }}>
                  {team.name}
                  {isActive && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                      style={{ background: `${team.color}20`, color: team.color }}>
                      دورك
                    </span>
                  )}
                </span>
                <span className="text-sm font-black tabular-nums shrink-0 mr-2"
                  style={{ color: isActive ? team.color : 'rgba(255,255,255,0.5)' }}>
                  {team.score}
                </span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: team.color, boxShadow: isActive ? `0 0 8px ${team.color}80` : 'none' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
