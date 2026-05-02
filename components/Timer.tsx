'use client'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'

interface Props {
  initialSeconds: number
  isActive: boolean
  onTimeUp: () => void
  color?: string
}

export default function Timer({ initialSeconds, isActive, onTimeUp, color = '#8B5CF6' }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds)

  const r = 45
  const circ = 2 * Math.PI * r
  const pct = seconds / initialSeconds
  const dash = circ * pct

  const timerColor = seconds > 10 ? color : seconds > 5 ? '#f59e0b' : '#ef4444'

  const hasFiredRef = useRef(false)

  useEffect(() => { 
    setSeconds(initialSeconds)
    hasFiredRef.current = false 
  }, [initialSeconds])

  useEffect(() => {
    if (!isActive || seconds < 0) return
    
    if (seconds === 0) {
      if (!hasFiredRef.current) {
        hasFiredRef.current = true
        onTimeUp()
      }
      return
    }

    const id = setInterval(() => setSeconds(p => p - 1), 1000)
    return () => clearInterval(id)
  }, [isActive, seconds, onTimeUp])

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="56" cy="56" r={r}
          stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
        <motion.circle cx="56" cy="56" r={r}
          stroke={timerColor} strokeWidth="6" fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 0.9, ease: 'linear' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          className="text-3xl font-black tabular-nums"
          animate={seconds <= 5 && isActive ? { scale: [1, 1.15, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          style={{ color: timerColor }}
        >
          {seconds}
        </motion.span>
      </div>
    </div>
  )
}
