/**
 * lib/security/sanitize.ts
 * ────────────────────────
 * Input sanitisation utilities for all user-supplied strings
 * before they reach the database or the AI model.
 *
 * Rules:
 *  - Strip HTML tags (XSS prevention)
 *  - Strip common SQL injection probes
 *  - Normalise excessive whitespace
 *  - Enforce per-field length caps
 *  - Block null bytes and other control characters
 */

// ── Patterns ────────────────────────────────────────────────────────────────

/** Matches any HTML / XML tag */
const HTML_TAG_RE = /<[^>]*>/g

/** Matches SQL injection probe characters/keywords (non-exhaustive, defence-in-depth) */
const SQL_PROBE_RE = /('|--|;|\/\*|\*\/|xp_|exec\s*\(|drop\s+table|insert\s+into|select\s+\*|union\s+select)/gi

/** Null byte */
const NULL_BYTE_RE = /\0/g

/** Control characters (except tab, newline, carriage return) */
const CONTROL_CHARS_RE = /[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g

// ── Core function ────────────────────────────────────────────────────────────

/**
 * Sanitise a single string value.
 * Returns the cleaned string, or throws if the value is flagged as malicious.
 */
export function sanitizeText(
  value: unknown,
  options: {
    /** Maximum allowed character length. Defaults to 500. */
    maxLength?: number
    /** Whether to allow multi-line input. Defaults to false. */
    multiline?: boolean
    /** Field label for error messages. */
    label?: string
  } = {}
): string {
  const { maxLength = 500, multiline = false, label = 'field' } = options

  if (value === null || value === undefined) return ''

  let str = String(value)

  // 1. Remove null bytes
  str = str.replace(NULL_BYTE_RE, '')

  // 2. Remove control characters
  str = str.replace(CONTROL_CHARS_RE, '')

  // 3. Strip HTML tags
  str = str.replace(HTML_TAG_RE, '')

  // 4. Remove SQL injection probes
  str = str.replace(SQL_PROBE_RE, '')

  // 5. Collapse excessive whitespace
  if (!multiline) {
    str = str.replace(/\s+/g, ' ')
  }
  str = str.trim()

  // 6. Enforce length
  if (str.length > maxLength) {
    throw new SanitizationError(
      `${label} exceeds maximum length of ${maxLength} characters`,
      label
    )
  }

  return str
}

// ── Typed helpers for common fields ────────────────────────────────────────

/** Team name: max 40 chars, single line */
export function sanitizeTeamName(value: unknown): string {
  return sanitizeText(value, { maxLength: 40, label: 'team name' })
}

/** Session / game name: max 80 chars, single line */
export function sanitizeSessionName(value: unknown): string {
  return sanitizeText(value, { maxLength: 80, label: 'session name' })
}

/** Custom AI topic setup: max 300 chars, multiline allowed */
export function sanitizeCustomSetup(value: unknown): string {
  return sanitizeText(value, { maxLength: 300, multiline: true, label: 'custom setup' })
}

/** Category / question name: max 200 chars */
export function sanitizeCategoryName(value: unknown): string {
  return sanitizeText(value, { maxLength: 200, label: 'category name' })
}

/**
 * Sanitise an array of team objects.
 * Returns a new array with all string fields cleaned.
 */
export function sanitizeTeams(
  teams: { name?: unknown; color?: unknown }[]
): { name: string; color: string } [] {
  return teams.map((t, i) => ({
    name:  sanitizeTeamName(t.name) || `فريق ${i + 1}`,
    color: sanitizeHexColor(t.color),
  }))
}

/**
 * Validate & sanitise a hex colour string.
 * Returns a safe fallback if the value is not a valid hex colour.
 */
export function sanitizeHexColor(value: unknown): string {
  const str = String(value ?? '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(str)) return str
  // Fallback palette
  const FALLBACK_COLORS = ['#FF3B3B', '#3B82F6', '#A855F7', '#22C55E']
  return FALLBACK_COLORS[0]
}

// ── Error class ──────────────────────────────────────────────────────────────

export class SanitizationError extends Error {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message)
    this.name = 'SanitizationError'
  }
}
