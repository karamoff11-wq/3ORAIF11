'use client'

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface VortexProps {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  particleCount?: number;
  baseHue?: number;
  backgroundColor?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export const Vortex = ({
  children,
  className = '',
  containerClassName = '',
  particleCount = 450,
  baseHue = 220,
  backgroundColor = '#05050A',
}: VortexProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    let animationFrameId: number
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = container.clientWidth)
    let height = (canvas.height = container.clientHeight)
    let cx = width / 2
    let cy = height / 2

    const handleResize = () => {
      if (!canvas || !container) return
      width = canvas.width = container.clientWidth
      height = canvas.height = container.clientHeight
      cx = width / 2
      cy = height / 2
    }

    window.addEventListener('resize', handleResize)

    // Diverse Color Palette: Cyan, Pink, Gold, Violet, Emerald
    const colorHues = [190, 320, 45, 260, 150]

    const createParticle = (isInitial = false): Particle => {
      const angle = Math.random() * Math.PI * 2
      const distance = isInitial ? Math.random() * Math.max(width, height) : Math.max(width, height) * 0.8
      const x = cx + Math.cos(angle) * distance
      const y = cy + Math.sin(angle) * distance
      const speed = 1 + Math.random() * 2.5
      
      return {
        x,
        y,
        vx: -Math.cos(angle + Math.PI / 2) * speed - Math.cos(angle) * (speed * 0.3),
        vy: -Math.sin(angle + Math.PI / 2) * speed - Math.sin(angle) * (speed * 0.3),
        radius: 1 + Math.random() * 2.5,
        hue: colorHues[Math.floor(Math.random() * colorHues.length)] + (Math.random() * 30 - 15),
        alpha: 0.1 + Math.random() * 0.8,
        life: 0,
        maxLife: 100 + Math.random() * 200,
      }
    }

    let particles: Particle[] = Array.from({ length: particleCount }, () => createParticle(true))

    let time = 0
    const render = () => {
      time += 0.01

      // Semi-transparent trail backplate
      ctx.fillStyle = backgroundColor === 'black' ? 'rgba(0, 0, 0, 0.12)' : 'rgba(5, 5, 15, 0.15)'
      ctx.fillRect(0, 0, width, height)

      ctx.save()
      ctx.globalCompositeOperation = 'lighter'

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.life++
        if (p.life >= p.maxLife) {
          particles[i] = createParticle()
          continue
        }

        // Swirling vortex physics toward center
        const dx = p.x - cx
        const dy = p.y - cy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const angle = Math.atan2(dy, dx)

        // Rotation force + gentle pull to center
        const rotSpeed = 0.05 + (1 / (dist * 0.02 + 1)) * 3
        const pullSpeed = 0.5 + dist * 0.005

        p.vx -= Math.cos(angle + Math.PI / 2) * rotSpeed + Math.cos(angle) * pullSpeed * 0.05
        p.vy -= Math.sin(angle + Math.PI / 2) * rotSpeed + Math.sin(angle) * pullSpeed * 0.05

        // Speed cap
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 8) {
          p.vx = (p.vx / speed) * 8
          p.vy = (p.vy / speed) * 8
        }

        p.x += p.vx
        p.y += p.vy
        p.hue = (p.hue + 0.3) % 360

        // Draw particle glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        const currentAlpha = p.alpha * Math.sin((p.life / p.maxLife) * Math.PI)
        ctx.fillStyle = `hsla(${Math.floor(p.hue)}, 90%, 65%, ${currentAlpha})`
        ctx.shadowBlur = 15
        ctx.shadowColor = `hsla(${Math.floor(p.hue)}, 90%, 65%, ${currentAlpha})`
        ctx.fill()
      }

      ctx.restore()
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [particleCount, backgroundColor])

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${containerClassName}`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />
      <div className={`relative z-10 ${className}`}>
        {children}
      </div>
    </div>
  )
}
