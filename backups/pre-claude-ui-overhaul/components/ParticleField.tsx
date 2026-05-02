'use client'

import { useEffect, useRef, useMemo } from 'react'

interface Particle {
  x: number; y: number; size: number
  color: string; vx: number; vy: number
  baseX: number; baseY: number; opacity: number; speed: number
}

const COLORS = ['#7c3aed','#06b6d4','#a855f7','#ec4899','#3b82f6','#8b5cf6']

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)

  const count = useMemo(() => 55, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Init particles
    particlesRef.current = Array.from({ length: count }, () => {
      const x = Math.random() * window.innerWidth
      const y = Math.random() * window.innerHeight
      return {
        x, y, baseX: x, baseY: y,
        size: 1.5 + Math.random() * 3.5,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        opacity: 0.15 + Math.random() * 0.35,
        speed: 0.008 + Math.random() * 0.012,
      }
    })

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', onMouseMove)

    let frame = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++
      const { x: mx, y: my } = mouseRef.current

      particlesRef.current.forEach(p => {
        // Gentle base drift
        p.baseX += p.vx
        p.baseY += p.vy
        if (p.baseX < 0 || p.baseX > canvas.width) p.vx *= -1
        if (p.baseY < 0 || p.baseY > canvas.height) p.vy *= -1

        // Mouse attraction (within 180px radius)
        const dx = mx - p.x
        const dy = my - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const maxDist = 180
        if (dist < maxDist) {
          const force = (maxDist - dist) / maxDist
          p.x += dx * force * 0.04
          p.y += dy * force * 0.04
        } else {
          // Ease back to base
          p.x += (p.baseX - p.x) * p.speed
          p.y += (p.baseY - p.y) * p.speed
        }

        // Pulse opacity slightly
        const pulseOpacity = p.opacity + Math.sin(frame * 0.02 + p.baseX) * 0.08

        // Draw with glow
        ctx.beginPath()
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
        grad.addColorStop(0, p.color + Math.round(pulseOpacity * 255).toString(16).padStart(2,'0'))
        grad.addColorStop(1, p.color + '00')
        ctx.fillStyle = grad
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.round(Math.min(pulseOpacity * 2, 1) * 255).toString(16).padStart(2,'0')
        ctx.fill()
      })

      // Mouse spotlight
      if (mx > -1000) {
        const spotlight = ctx.createRadialGradient(mx, my, 0, mx, my, 300)
        spotlight.addColorStop(0, 'rgba(124,58,237,0.07)')
        spotlight.addColorStop(1, 'rgba(124,58,237,0)')
        ctx.fillStyle = spotlight
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      rafRef.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [count])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, opacity: 0.9 }}
    />
  )
}
