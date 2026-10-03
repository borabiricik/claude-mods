import type { PromptStats, Totals } from '../types'

// An insertion this long in one edit is a paste or a history recall, not typing.
export const PASTE_MIN_CHARS = 8
// A longer pause between keys is thinking time and is left out of the clock.
export const IDLE_GAP_MS = 5_000
export const MIN_TYPED_CHARS = 10
const MIN_ACTIVE_MS = 1_000
const CHARS_PER_WORD = 5
const DAYS_KEPT = 30

export type Draft = {
  typedChars: number
  pastedChars: number
  deletedChars: number
  activeMs: number
  lastAt: number | null
}

export type Edit = { start: number; end: number; inputText: string }

export const emptyDraft = (): Draft => ({
  typedChars: 0,
  pastedChars: 0,
  deletedChars: 0,
  activeMs: 0,
  lastAt: null,
})

export const emptyTotals = (): Totals => ({
  prompts: 0,
  typedChars: 0,
  pastedChars: 0,
  deletedChars: 0,
  words: 0,
  activeMs: 0,
  bestWpm: 0,
})

export function applyEdit(draft: Draft, edit: Edit, now: number): Draft {
  const deleted = edit.end - edit.start
  const inserted = edit.inputText.length
  if (deleted === 0 && inserted === 0) return draft

  if (inserted >= PASTE_MIN_CHARS) {
    return { ...draft, pastedChars: draft.pastedChars + inserted, deletedChars: draft.deletedChars + deleted }
  }

  const gap = draft.lastAt === null ? 0 : now - draft.lastAt
  return {
    ...draft,
    typedChars: draft.typedChars + inserted,
    deletedChars: draft.deletedChars + deleted,
    activeMs: draft.activeMs + (gap <= IDLE_GAP_MS ? gap : 0),
    lastAt: now,
  }
}

// A slash command's name is typed from muscle memory and completed by Tab; only its arguments count.
function commandNameEnd(text: string): number {
  if (!text.startsWith('/')) return -1
  const space = text.search(/\s/)
  return space === -1 ? text.length : space
}

export const isCommandNameEdit = (textAfter: string, start: number) => start <= commandNameEnd(textAfter)

export function argumentsOf(text: string): string {
  const end = commandNameEnd(text)
  return end === -1 ? text : text.slice(end)
}

export const wpmOf = (chars: number, ms: number) => (ms > 0 ? chars / CHARS_PER_WORD / (ms / 60_000) : 0)

export function summarize(draft: Draft, submitted: string): PromptStats | null {
  if (draft.typedChars < MIN_TYPED_CHARS || draft.activeMs < MIN_ACTIVE_MS) return null

  return {
    typedChars: draft.typedChars,
    pastedChars: draft.pastedChars,
    deletedChars: draft.deletedChars,
    words: submitted.trim().split(/\s+/).filter(Boolean).length,
    activeMs: draft.activeMs,
    wpm: wpmOf(draft.typedChars, draft.activeMs),
    cpm: draft.typedChars / (draft.activeMs / 60_000),
    accuracy: Math.max(0, 1 - draft.deletedChars / draft.typedChars),
  }
}

export const addToTotals = (t: Totals, s: PromptStats): Totals => ({
  prompts: t.prompts + 1,
  typedChars: t.typedChars + s.typedChars,
  pastedChars: t.pastedChars + s.pastedChars,
  deletedChars: t.deletedChars + s.deletedChars,
  words: t.words + s.words,
  activeMs: t.activeMs + s.activeMs,
  bestWpm: Math.max(t.bestWpm, s.wpm),
})

export const averageWpm = (t: Totals) => wpmOf(t.typedChars, t.activeMs)

export function dayKey(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function recordDay(days: Record<string, Totals>, key: string, s: PromptStats): Record<string, Totals> {
  const next = { ...days, [key]: addToTotals(days[key] ?? emptyTotals(), s) }
  return Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)).slice(-DAYS_KEPT))
}

export const formatNumber = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')

export function formatDuration(ms: number): string {
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function formatPrompt(s: PromptStats): string {
  const parts = [
    `${Math.round(s.wpm)} WPM`,
    `${formatNumber(s.cpm)} CPM`,
    `${Math.round(s.accuracy * 100)}% accuracy`,
    `${formatNumber(s.typedChars)} chars, ${s.words} words in ${formatDuration(s.activeMs)}`,
  ]
  if (s.pastedChars > 0) parts.push(`+${formatNumber(s.pastedChars)} pasted`)
  return parts.join(' · ')
}

export function formatTotals(t: Totals): string {
  if (t.prompts === 0) return 'nothing measured yet'
  return [
    `${t.prompts} prompt${t.prompts === 1 ? '' : 's'}`,
    `${Math.round(averageWpm(t))} WPM avg`,
    `best ${Math.round(t.bestWpm)}`,
    `${formatNumber(t.typedChars)} chars, ${formatNumber(t.words)} words`,
    `${formatDuration(t.activeMs)} typing`,
  ].join(' · ')
}
