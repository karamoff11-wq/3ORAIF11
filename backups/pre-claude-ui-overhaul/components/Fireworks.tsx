'use client'

import { useEffect, useRef } from 'react'

export default function Fireworks({ colors }: { colors: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || colors.length === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)
    resize()

    const particles: any[] = []
    const rockets: any[] = []
    let animId = 0

    const createExplosion = (x: number, y: number, color: string) => {
      const pCount = 15 + Math.random() * 15
      for (let i = 0; i < pCount; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = Math.random() * 3 + 0.5
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color,
          alpha: 1,
          decay: Math.random() * 0.01 + 0.005
        })
      }
    }

    const launchRocket = () => {
      const x = canvas.width * 0.2 + Math.random() * (canvas.width * 0.6) // Launch from middle 60% of width
      const y = canvas.height
      const color = colors[Math.floor(Math.random() * colors.length)]
      const vy = -(Math.random() * 3 + 5) // Shoot up slowly
      const vx = (Math.random() - 0.5) * 2
      rockets.push({ x, y, vx, vy, color, alpha: 1 })
    }

    // Auto trigger fireworks rockets less frequently
    const triggerInterval = setInterval(() => {
      launchRocket()
    }, 2500)

    launchRocket()

    const draw = () => {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0,0,0,0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = 'lighter'

      // Draw and update rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i]
        r.x += r.vx
        r.y += r.vy
        r.vy += 0.04 // gravity
        
        ctx.beginPath()
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = r.color
        ctx.shadowBlur = 8
        ctx.shadowColor = r.color
        ctx.fill()

        // Explode at peak
        if (r.vy >= -0.5) {
          createExplosion(r.x, r.y, r.color)
          rockets.splice(i, 1)
        }
      }

      // Draw and update explosion particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.03 // light gravity
        p.alpha -= p.decay

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.shadowBlur = 4
        ctx.shadowColor = p.color
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(triggerInterval)
      cancelAnimationFrame(animId)
    }
  }, [colors])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  )
}
