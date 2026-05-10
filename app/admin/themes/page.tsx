'use client'
// ─── app/admin/themes/page.tsx ─────────────────────────────────────────────────
// Admin control panel to preview, apply, and generate special links for all themes.
//
// ⚠️  Add your own admin auth guard at the top of this component (check session
//     role === 'admin' from Supabase, redirect otherwise).
//
// Usage:
//   Navigate to /admin/themes in your browser.
//   The panel lives outside the user-facing dashboard so admins can test freely.

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'
import { themes, themesList } from '@/lib/themes'
import { Theme, ThemeId } from '@/types/theme'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function buildLink(baseUrl: string, themeId: ThemeId, path = '/dashboard') {
  return `${baseUrl}${path}?theme=${themeId}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function ColorSwatch({ color }: { color: string }) {
  return (
    <div
      className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0"
      style={{ backgroundColor: color }}
      title={color}
    />
  )
}

function CopyButton({
  label,
  value,
  copyId,
  activeCopyId,
  onCopy,
}: {
  label: string
  value: string
  copyId: string
  activeCopyId: string | null
  onCopy: (id: string, value: string) => void
}) {
  const copied = activeCopyId === copyId
  return (
    <button
      onClick={() => onCopy(copyId, value)}
      className="flex-1 py-1.5 rounded-xl text-xs font-medium transition-all border"
      style={{
        borderColor: copied ? '#22c55e44' : '#ffffff11',
        color: copied ? '#22c55e' : '#9CA3AF',
        backgroundColor: copied ? '#22c55e11' : '#ffffff07',
      }}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}

// ─── Theme Card ────────────────────────────────────────────────────────────────
function ThemeCard({
  t,
  isActive,
  previewName,
  activeCopyId,
  onApply,
  onCopy,
}: {
  t: Theme
  isActive: boolean
  previewName: string
  activeCopyId: string | null
  onApply: (id: ThemeId) => void
  onCopy: (id: string, value: string) => void
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border overflow-hidden transition-shadow duration-300"
      style={{
        backgroundColor: isActive ? `${t.colors.primary}12` : t.colors.surface,
        borderColor: isActive ? t.colors.primary : t.colors.border,
        boxShadow: isActive ? t.colors.glow : 'none',
      }}
    >
      {/* Active badge */}
      {isActive && (
        <div
          className="absolute top-3 end-3 text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: t.colors.primary, color: '#fff' }}
        >
          ACTIVE
        </div>
      )}

      <div className="p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: `${t.colors.primary}22` }}
          >
            {t.emoji}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{t.name}</p>
            <p className="text-xs mt-0.5" style={{ color: t.colors.primary }}>
              {t.nameAr}
            </p>
          </div>
        </div>

        {/* Colour palette */}
        <div className="flex items-center gap-2">
          {[t.colors.primary, t.colors.primaryLight, t.colors.secondary, t.colors.accent,
            t.colors.surface, t.colors.border].map((c, i) => (
            <ColorSwatch key={i} color={c} />
          ))}
        </div>

        {/* Greeting preview */}
        <div
          className="rounded-xl p-3"
          style={{
            backgroundColor: `${t.colors.primary}0D`,
            borderLeft: `3px solid ${t.colors.primary}`,
          }}
        >
          <p className="text-[10px] uppercase tracking-wider mb-1.5" style={{ color: t.colors.textMuted }}>
            Greeting preview
          </p>
          <p className="text-sm font-semibold" style={{ color: t.colors.text }}>
            {t.greeting(previewName || null)}
          </p>
          <p className="text-xs mt-1 opacity-80" style={{ color: t.colors.primary }}>
            {t.greetingAr(previewName || null)}
          </p>
          {t.subGreeting && (
            <p className="text-[11px] mt-1.5" style={{ color: t.colors.textMuted }}>
              {t.subGreeting}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Apply button */}
          <button
            onClick={() => onApply(t.id)}
            disabled={isActive}
            className="w-full py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.97] disabled:cursor-default"
            style={{
              background: isActive
                ? `${t.colors.primary}22`
                : `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.accent})`,
              color: isActive ? t.colors.primary : '#fff',
              boxShadow: isActive ? 'none' : `0 4px 16px ${t.colors.primary}44`,
            }}
          >
            {isActive ? '✓ Currently Active' : 'Apply Theme'}
          </button>

          {/* Copy link buttons */}
          <div className="flex gap-2">
            <CopyButton
              label="🏠 Home Link"
              copyId={`home-${t.id}`}
              value={buildLink(origin, t.id, '/')}
              activeCopyId={activeCopyId}
              onCopy={onCopy}
            />
            <CopyButton
              label="📋 Dashboard Link"
              copyId={`dash-${t.id}`}
              value={buildLink(origin, t.id, '/dashboard')}
              activeCopyId={activeCopyId}
              onCopy={onCopy}
            />
          </div>

          {/* Raw URL display */}
          <p
            className="text-[10px] px-3 py-1.5 rounded-lg font-mono truncate"
            style={{ backgroundColor: `${t.colors.border}50`, color: t.colors.textMuted }}
          >
            ?theme={t.id}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AdminThemesPage() {
  const { themeId, theme, setTheme } = useTheme()
  const [previewName, setPreviewName] = useState('Ahmed')
  const [activeCopyId, setActiveCopyId] = useState<string | null>(null)
  const [resetConfirm, setResetConfirm] = useState(false)

  const handleCopy = useCallback((id: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => {})
    setActiveCopyId(id)
    setTimeout(() => setActiveCopyId(null), 2200)
  }, [])

  const handleReset = () => {
    if (!resetConfirm) { setResetConfirm(true); setTimeout(() => setResetConfirm(false), 3000); return }
    setTheme('default')
    setResetConfirm(false)
  }

  return (
    <div
      className="min-h-screen p-6 md:p-10 transition-colors duration-500"
      style={{ backgroundColor: theme.colors.background }}
    >
      <div className="max-w-5xl mx-auto">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-2xl">🎨</span>
                <h1 className="text-xl md:text-2xl font-bold text-white">Theme Control Center</h1>
              </div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                Apply themes, generate special links, and preview greetings.
              </p>
            </div>

            {/* Reset button */}
            <button
              onClick={handleReset}
              className="text-xs px-4 py-2 rounded-xl border transition-colors"
              style={{
                borderColor: resetConfirm ? '#ef444466' : theme.colors.border,
                color: resetConfirm ? '#ef4444' : theme.colors.textMuted,
                backgroundColor: resetConfirm ? '#ef444411' : 'transparent',
              }}
            >
              {resetConfirm ? '⚠ Click again to reset' : '↺ Reset to Default'}
            </button>
          </div>

          {/* Active theme pill */}
          <div
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border"
            style={{
              borderColor: theme.colors.borderGlow,
              backgroundColor: `${theme.colors.primary}14`,
            }}
          >
            <span className="text-base">{themes[themeId].emoji}</span>
            <span className="text-sm font-semibold" style={{ color: theme.colors.primary }}>
              Active theme: {themes[themeId].name}
            </span>
          </div>
        </div>

        {/* ── Preview name input ──────────────────────────────────────────────── */}
        <div
          className="mb-8 p-5 rounded-2xl border"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
        >
          <label className="block text-xs font-semibold uppercase tracking-wider mb-3"
                 style={{ color: theme.colors.textMuted }}>
            Preview greeting with a name
          </label>
          <div className="flex gap-3 items-center">
            <span className="text-2xl">👤</span>
            <input
              type="text"
              value={previewName}
              onChange={(e) => setPreviewName(e.target.value)}
              placeholder="Enter any name…"
              className="flex-1 bg-transparent border rounded-xl px-4 py-2.5 text-sm text-white
                         outline-none transition-colors placeholder:text-gray-600"
              style={{ borderColor: theme.colors.border }}
              onFocus={(e) => (e.target.style.borderColor = theme.colors.primary)}
              onBlur={(e) => (e.target.style.borderColor = theme.colors.border)}
            />
          </div>
        </div>

        {/* ── Theme cards grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
          {themesList.map((t) => (
            <ThemeCard
              key={t.id}
              t={t}
              isActive={t.id === themeId}
              previewName={previewName}
              activeCopyId={activeCopyId}
              onApply={setTheme}
              onCopy={handleCopy}
            />
          ))}
        </div>

        {/* ── How it works guide ───────────────────────────────────────────────── */}
        <div
          className="p-6 rounded-2xl border"
          style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.border }}
        >
          <h2 className="text-base font-bold text-white mb-5">📖 How Special Links Work</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {([
              { step: '1', title: 'Copy the link', desc: 'Use "Home Link" or "Dashboard Link" on any theme card.' },
              { step: '2', title: 'Share with a group', desc: 'Send to your medical team, engineering dept, teachers, etc.' },
              { step: '3', title: 'Auto-preview', desc: 'The theme applies instantly when they open the link.' },
              { step: '4', title: 'User chooses', desc: 'A banner lets them keep the theme or revert to default.' },
            ] as const).map((item) => (
              <div key={item.step} className="flex gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    color: theme.colors.primary,
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: theme.colors.textMuted }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
