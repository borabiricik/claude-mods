export type Tier = { icon: string; label: string; color: string; from: number }

const TIERS: readonly Tier[] = [
  { icon: '⚡', label: 'Lightning', color: '#bb9af7', from: 110 },
  { icon: '🔥', label: 'On fire', color: '#f7768e', from: 85 },
  { icon: '🚀', label: 'Rocket', color: '#ff9e64', from: 65 },
  { icon: '🏃', label: 'Quick', color: '#9ece6a', from: 45 },
  { icon: '🚶', label: 'Steady', color: '#7dcfff', from: 25 },
  { icon: '🐢', label: 'Warming up', color: '#7aa2f7', from: 0 },
]

export const tierOf = (wpm: number): Tier => TIERS.find(t => wpm >= t.from) ?? TIERS[TIERS.length - 1]!

export const RAINBOW = ['#f7768e', '#ff9e64', '#e0af68', '#9ece6a', '#7dcfff', '#bb9af7'] as const
export const SPINNER = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'] as const
export const SPARKLES = ['✦', '✧', '⋆', '✶', '✷', '✸'] as const
const BARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'] as const

export const GAUGE_MAX_WPM = 120
const BURST_WINDOW_MS = 3_000

export const pick = <T>(list: readonly T[], i: number): T => list[((i % list.length) + list.length) % list.length]!

export function gauge(wpm: number, cells: number): { filled: string; empty: string } {
  const n = Math.max(0, Math.min(cells, Math.round((wpm / GAUGE_MAX_WPM) * cells)))
  return { filled: '▰'.repeat(n), empty: '▱'.repeat(cells - n) }
}

export function sparkline(values: readonly number[], max = Math.max(1, ...values)): string {
  return values.map(v => BARS[Math.max(0, Math.min(BARS.length - 1, Math.round((v / max) * (BARS.length - 1))))]).join('')
}

export function burstWpm(keyTimes: readonly number[], now: number): number {
  const recent = keyTimes.filter(t => now - t <= BURST_WINDOW_MS)
  if (recent.length < 2) return 0
  return recent.length / 5 / (BURST_WINDOW_MS / 60_000)
}

export const easeOut = (t: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3)

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export const weekdayOf = (dayKey: string) => WEEKDAYS[new Date(`${dayKey}T12:00:00`).getDay()]!

export function lastDays(dayKeyOf: (ms: number) => string, now: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) => dayKeyOf(now - (count - 1 - i) * 86_400_000))
}
