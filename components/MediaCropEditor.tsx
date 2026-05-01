'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'

export interface CropSlot {
  key: 'topic_bg' | 'cat_setup' | 'cat_game'
  label: string
  sublabel: string
  width: number
  height: number
}

const SLOTS: CropSlot[] = [
  { key: 'topic_bg',  label: 'خلفية الموضوع',        sublabel: '16:9 — صفحة الإعداد',  width: 320, height: 180 },
  { key: 'cat_setup', label: 'بطاقة الفئة (الإعداد)', sublabel: '2:3 — اختيار الفئات',  width: 160, height: 240 },
  { key: 'cat_game',  label: 'بطاقة الفئة (اللعبة)',  sublabel: '1:1 — شبكة الأسئلة',  width: 220, height: 220 },
]

export interface CropConfig {
  topic_bg?:  { x: number; y: number; zoom: number }
  cat_setup?: { x: number; y: number; zoom: number }
  cat_game?:  { x: number; y: number; zoom: number }
}

interface Props {
  mediaUrl: string
  mediaType: 'image' | 'video'
  initialConfig?: CropConfig
  availableSlots?: Array<CropSlot['key']>
  onSave: (config: CropConfig) => void
  onClose: () => void
}

const DEFAULT_CROP = { x: 50, y: 50, zoom: 1 }

export default function MediaCropEditor({ mediaUrl, mediaType, initialConfig, availableSlots, onSave, onClose }: Props) {
  const [config, setConfig] = useState<CropConfig>(() => {
    const c: CropConfig = {}
    SLOTS.forEach(s => {
      if (!availableSlots || availableSlots.includes(s.key)) {
        c[s.key] = { ...(initialConfig?.[s.key] ?? DEFAULT_CROP) }
      }
    })
    return c
  })

  const dragRef = useRef<{
    key: CropSlot['key']
    slotW: number
    slotH: number
    startMouseX: number
    startMouseY: number
    startX: number
    startY: number
    zoom: number
  } | null>(null)

  const configRef = useRef(config)
  useEffect(() => { configRef.current = config }, [config])

  const startDrag = (key: CropSlot['key'], slotW: number, slotH: number, e: React.MouseEvent) => {
    e.preventDefault()
    const crop = configRef.current[key] ?? DEFAULT_CROP
    dragRef.current = {
      key, slotW, slotH,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: crop.x,
      startY: crop.y,
      zoom: crop.zoom,
    }
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const dx = e.clientX - d.startMouseX
      const dy = e.clientY - d.startMouseY
      // Sensitivity: moving slotWidth pixels shifts 100% / zoom of the object-position range
      // Higher zoom = image is "bigger" relative to viewport = less position change per pixel
      const sensitivity = 100 / (d.slotW * d.zoom)
      const newX = Math.max(0, Math.min(100, d.startX - dx * sensitivity))
      const newY = Math.max(0, Math.min(100, d.startY - dy * sensitivity))
      setConfig(prev => ({ ...prev, [d.key]: { ...prev[d.key], x: newX, y: newY } }))
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const setZoom = (key: CropSlot['key'], zoom: number) => {
    setConfig(prev => ({ ...prev, [key]: { ...(prev[key] ?? DEFAULT_CROP), zoom } }))
  }

  const resetSlot = (key: CropSlot['key']) => {
    setConfig(prev => ({ ...prev, [key]: { ...DEFAULT_CROP } }))
  }

  const visibleSlots = SLOTS.filter(s => !availableSlots || availableSlots.includes(s.key))

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(24px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 32 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        className="bg-[#0c0c14] border border-white/10 rounded-3xl p-8 w-full max-w-5xl overflow-y-auto max-h-[95vh] space-y-8"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">✂️ ضبط الوسائط</h2>
            <p className="text-white/40 text-sm mt-1">
              كبّر بالسلايدر ثم اسحب الإطار لتحديد المنطقة المرئية
            </p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white text-2xl leading-none transition-colors">✕</button>
        </div>

        {/* Slot previews */}
        <div className="flex flex-wrap gap-10 justify-center">
          {visibleSlots.map(slot => {
            const crop = config[slot.key] ?? DEFAULT_CROP
            const { zoom, x, y } = crop

            // The media fills its box (object-fit cover), then we scale it and pin the origin
            const mediaStyle: React.CSSProperties = {
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `${x}% ${y}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${x}% ${y}%`,
              pointerEvents: 'none',
              userSelect: 'none',
            }

            return (
              <div key={slot.key} className="flex flex-col items-center gap-4">
                {/* Labels */}
                <div className="text-center">
                  <p className="font-bold text-white text-sm">{slot.label}</p>
                  <p className="text-white/30 text-xs">{slot.sublabel}</p>
                </div>

                {/* Preview box */}
                <div
                  style={{
                    width: slot.width,
                    height: slot.height,
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0,
                    borderRadius: 12,
                    border: `2px solid ${zoom > 1 ? 'rgba(168,85,247,0.6)' : 'rgba(255,255,255,0.15)'}`,
                    cursor: zoom > 1 ? 'grab' : 'default',
                    background: '#111',
                  }}
                  onMouseDown={e => zoom > 1 && startDrag(slot.key, slot.width, slot.height, e)}
                >
                  {mediaType === 'video' ? (
                    <video
                      key={mediaUrl}
                      src={mediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={mediaStyle}
                    />
                  ) : (
                    <img
                      key={mediaUrl}
                      src={mediaUrl}
                      alt="preview"
                      draggable={false}
                      style={mediaStyle}
                    />
                  )}

                  {/* Crosshair */}
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.2)' }} />
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.2)' }} />
                  </div>

                  {/* Hint when zoom=1 */}
                  {zoom <= 1 && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.3)',
                      pointerEvents: 'none',
                    }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', padding: '0 8px' }}>
                        كبّر للتحريك
                      </span>
                    </div>
                  )}
                </div>

                {/* Zoom slider */}
                <div style={{ width: slot.width }} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-white/40">
                    <span>تكبير</span>
                    <span className="font-mono">{zoom.toFixed(2)}×</span>
                  </div>
                  <input
                    type="range" min="1" max="3" step="0.05"
                    value={zoom}
                    onChange={e => setZoom(slot.key, parseFloat(e.target.value))}
                    className="w-full accent-purple-500"
                  />
                  <div className="flex justify-between text-[10px] text-white/20">
                    <span>1×</span><span>3×</span>
                  </div>
                </div>

                {/* Coords + reset */}
                <div className="flex items-center justify-between text-[11px] text-white/25" style={{ width: slot.width }}>
                  <span className="font-mono">x:{x.toFixed(0)}% y:{y.toFixed(0)}%</span>
                  <button onClick={() => resetSlot(slot.key)} className="hover:text-white/60 transition-colors underline underline-offset-2">
                    إعادة ضبط
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-4 pt-4 border-t border-white/5">
          <button
            onClick={() => onSave(config)}
            className="flex-1 py-4 rounded-2xl bg-white text-black font-black text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          >
            حفظ الإعدادات ✓
          </button>
          <button
            onClick={onClose}
            className="px-8 py-4 rounded-2xl border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-all font-bold"
          >
            إلغاء
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
