'use client'

import { useEffect, useRef } from 'react'

interface Team { color: string; score?: number }
interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string
  teamIndex: number
  radius: number
}

interface FightingParticlesProps {
  teams: Team[]
  mode?: 'setup' | 'game'
}

export default function FightingParticles({ teams, mode = 'game' }: FightingParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ particles: Particle[]; animId: number }>({ particles: [], animId: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    resize()

    // Initialise particles
    const COUNT_PER_TEAM = mode === 'setup' ? 20 : 30
    const particles: Particle[] = []
    teams.forEach((team, ti) => {
      for (let k = 0; k < COUNT_PER_TEAM; k++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 1.5 + Math.random() * 2
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: team.color,
          teamIndex: ti,
          radius: 3 + Math.random() * 4,
        })
      }
    })
    stateRef.current.particles = particles



    const draw = () => {
      ctx.fillStyle = 'rgba(5,5,5,0.18)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const ps = stateRef.current.particles

      for (let i = 0; i < ps.length; i++) {
        const p = ps[i]

        // Bounce off walls
        if (p.x < p.radius)                 { p.x = p.radius;                 p.vx *= -1 }
        if (p.x > canvas.width - p.radius)  { p.x = canvas.width - p.radius;  p.vx *= -1 }
        if (p.y < p.radius)                 { p.y = p.radius;                 p.vy *= -1 }
        if (p.y > canvas.height - p.radius) { p.y = canvas.height - p.radius; p.vy *= -1 }

        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j]
          const dx = q.x - p.x
          const dy = q.y - p.y
          const distSq = dx * dx + dy * dy
          const dist = Math.sqrt(distSq) || 0.01

          // Very simple collision & bounce
          if (dist < 40) { // Collision or near-miss
            const nx = dx / dist
            const ny = dy / dist
            
            // Simple repulsion for all particles to bounce away from each other
            const force = 5 / dist
            p.vx -= nx * force
            p.vy -= ny * force
            q.vx += nx * force
            q.vy += ny * force
            
            if (p.teamIndex !== q.teamIndex && dist < 20) {
              // Draw a tiny flash on impact if they are very close and enemies
               ctx.beginPath()
               ctx.arc(p.x + dx/2, p.y + dy/2, 8, 0, Math.PI * 2)
               ctx.fillStyle = 'rgba(255,255,255,0.8)'
               ctx.fill()
            }
          }
        }

        // Apply friction to prevent them from flying too fast indefinitely
        p.vx *= 0.99
        p.vy *= 0.99

        // Keep them moving if they slow down too much
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (spd < 1.5) {
          p.vx += (Math.random() - 0.5) * 0.5
          p.vy += (Math.random() - 0.5) * 0.5
        } else if (spd > 6) {
          // Cap maximum speed
          p.vx = (p.vx / spd) * 6
          p.vy = (p.vy / spd) * 6
        }

        p.x += p.vx
        p.y += p.vy

        // Draw
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.shadowBlur = p.radius * 5
        ctx.shadowColor = p.color
        ctx.fill()
        ctx.shadowBlur = 0
      }

      stateRef.current.animId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(stateRef.current.animId)
    }
  }, [teams, mode])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 mix-blend-screen opacity-70"
    />
  )
}
