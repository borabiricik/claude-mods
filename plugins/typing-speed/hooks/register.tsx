import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { PromptStats, Totals } from '../types'
import {
  addToTotals,
  applyEdit,
  averageWpm,
  dayKey,
  emptyDraft,
  emptyTotals,
  formatDuration,
  formatNumber,
  formatPrompt,
  formatTotals,
  recordDay,
  summarize,
  wpmOf,
} from './stats'
import {
  GAUGE_MAX_WPM,
  RAINBOW,
  SPARKLES,
  SPINNER,
  burstWpm,
  easeOut,
  gauge,
  lastDays,
  pick,
  sparkline,
  tierOf,
  weekdayOf,
} from './ui'

const session = atom({ plugin: 'typing-speed', key: 'session' } as const, emptyTotals())
const last = atom({ plugin: 'typing-speed', key: 'last' } as const, null)

const ALL_TIME_KEY = 'allTime'
const DAYS_KEY = 'days'
const RECENT_KEY = 'recent'
const PANE = 'typing-stats'

const TICK_MS = 100
const TYPING_FADE_MS = 2_500
const CARD_DIM_MS = 6_000
const CARD_HIDE_MS = 9_000
const COUNT_UP_MS = 700
const SAMPLE_EVERY_TICKS = 3
const SAMPLES_KEPT = 24
const RECENT_KEPT = 30
const MIN_CHARS_FOR_HUD = 3

type Book = { allTime: Totals; days: Record<string, Totals>; recent: number[] }
type Card = { stats: PromptStats; isNewBest: boolean; previousBest: number; average: number; shownAt: number }

const emptyBook = (): Book => ({ allTime: emptyTotals(), days: {}, recent: [] })

async function loadBook($: EngineInterface): Promise<Book> {
  const [allTime, days, recent] = await Promise.all([
    $.store.get(ALL_TIME_KEY),
    $.store.get(DAYS_KEY),
    $.store.get(RECENT_KEY),
  ])
  return {
    allTime: { ...emptyTotals(), ...(allTime as Partial<Totals> | undefined) },
    days: (days as Record<string, Totals> | undefined) ?? {},
    recent: (recent as number[] | undefined) ?? [],
  }
}

let book = emptyBook()
let isBookLoaded = false
let draft = emptyDraft()
let keyTimes: number[] = []
let samples: number[] = []
let keystrokes = 0
let lastKeyAt = 0
let card: Card | null = null
let ticker: Timer | null = null
let ticks = 0

const isTyping = (now: number) => draft.typedChars >= MIN_CHARS_FOR_HUD && now - lastKeyAt < TYPING_FADE_MS
const isCardShown = (now: number) => card !== null && now - card.shownAt < CARD_HIDE_MS

async function tick($: EngineInterface) {
  const now = await $.clock.now()
  ticks += 1
  if (isTyping(now) && ticks % SAMPLE_EVERY_TICKS === 0) {
    samples = [...samples, burstWpm(keyTimes, now)].slice(-SAMPLES_KEPT)
  }
  if (!isTyping(now) && !isCardShown(now)) {
    ticker?.cancel()
    ticker = null
  }
  $.ui.invalidate('ui.render')
}

function animate($: EngineInterface) {
  $.ui.invalidate('ui.render')
  ticker ??= $.clock.every(TICK_MS, () => void tick($))
}

function resetDraft() {
  draft = emptyDraft()
  keyTimes = []
  samples = []
  lastKeyAt = 0
}

async function ensureBook($: EngineInterface) {
  if (isBookLoaded) return
  book = await loadBook($)
  isBookLoaded = true
}

async function record($: EngineInterface, stats: PromptStats, now: number): Promise<Card> {
  await ensureBook($)
  const previousBest = book.allTime.bestWpm
  book = {
    allTime: addToTotals(book.allTime, stats),
    days: recordDay(book.days, dayKey(now), stats),
    recent: [...book.recent, stats.wpm].slice(-RECENT_KEPT),
  }
  await Promise.all([
    $.store.set(ALL_TIME_KEY, book.allTime),
    $.store.set(DAYS_KEY, book.days),
    $.store.set(RECENT_KEY, book.recent),
    update($, session, t => addToTotals(t, stats)),
    update($, last, () => stats),
  ])

  return { stats, isNewBest: stats.wpm > previousBest, previousBest, average: averageWpm(book.allTime), shownAt: now }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'typing',
      description: 'Open your typing stats: averages, best, last 7 days and recent prompts',
      argumentHint: '[reset]',
    })
    await ensureBook($)

    return next(e)
  })

  on('prompt.edit', async ($, e, next) => {
    const [now, box] = await Promise.all([$.clock.now(), next(e)])
    if (box.text === '') {
      resetDraft()
      $.ui.invalidate('ui.render')
      return box
    }

    const before = draft
    draft = applyEdit(draft, e, now)
    const isTypedKey = draft.typedChars > before.typedChars
    if (isTypedKey || draft.deletedChars > before.deletedChars) {
      if (before.typedChars === 0) samples = []
      if (isTypedKey) keyTimes = [...keyTimes.filter(t => now - t <= 3_000), now]
      keystrokes += 1
      lastKeyAt = now
      card = null
      animate($)
    }

    return box
  })

  on('prompt.submit', async ($, e, next) => {
    const finished = draft
    resetDraft()
    const entered = await next(e)

    const isTyped = e.origin.kind === 'composer' && !e.text.trimStart().startsWith('/')
    const stats = isTyped ? summarize(finished, e.text) : null
    if (stats) card = await record($, stats, await $.clock.now())
    animate($)

    return entered
  })

  on('command.run', { command: 'typing' }, async ($, e) => {
    if (e.args.trim() === 'reset') {
      book = emptyBook()
      isBookLoaded = true
      card = null
      await Promise.all([
        $.store.delete(ALL_TIME_KEY),
        $.store.delete(DAYS_KEY),
        $.store.delete(RECENT_KEY),
        update($, session, () => emptyTotals()),
        update($, last, () => null),
      ])
      $.ui.invalidate('ui.render')

      return { text: '🧹 Typing stats cleared.' }
    }

    await ensureBook($)
    const opened = await $.ui.open({ id: PANE, title: '⌨ Typing stats' })
    if (opened.isPlaced) return {}

    const [lastStats, sessionTotals] = await Promise.all([read($, last), read($, session)])
    return {
      text: [
        `Last prompt  ${lastStats ? formatPrompt(lastStats) : 'nothing measured yet'}`,
        `Session      ${formatTotals(sessionTotals)}`,
        `All time     ${formatTotals(book.allTime)}`,
      ].join('\n'),
    }
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const now = await $.clock.now()
    const { Box, Text } = $.ui.resolve(e)
    const width = e.props.bodyColumns

    if (isTyping(now)) {
      const wpm = draft.activeMs >= 1_000 ? wpmOf(draft.typedChars, draft.activeMs) : burstWpm(keyTimes, now)
      const tier = tierOf(wpm)
      const bar = gauge(wpm, 12)
      const isBlazing = wpm >= 85
      const accuracy = Math.round(Math.max(0, 1 - draft.deletedChars / draft.typedChars) * 100)

      return (
        <Box flexDirection="row" gap={1}>
          <Text color={tier.color} bold>{pick(SPINNER, keystrokes)}</Text>
          <Text>{tier.icon}</Text>
          <Text color={tier.color} bold>{`${String(Math.round(wpm)).padStart(3)} WPM`}</Text>
          <Box flexDirection="row">
            {bar.filled !== '' && <Text color={isBlazing ? pick(RAINBOW, ticks) : tier.color}>{bar.filled}</Text>}
            {bar.empty !== '' && <Text dimColor>{bar.empty}</Text>}
          </Box>
          {width >= 72 && samples.length > 0 && <Text color={tier.color}>{sparkline(samples, GAUGE_MAX_WPM)}</Text>}
          <Text color={tier.color} italic>{tier.label}</Text>
          {width >= 100 && (
            <Text dimColor>{`⏱ ${formatDuration(draft.activeMs)}  ✎ ${draft.typedChars}  🎯 ${accuracy}%`}</Text>
          )}
        </Box>
      )
    }

    if (card && isCardShown(now)) {
      const age = now - card.shownAt
      const { stats } = card
      const tier = tierOf(stats.wpm)
      const isDim = age > CARD_DIM_MS
      const accent = card.isNewBest ? pick(RAINBOW, ticks) : tier.color
      const shownWpm = Math.round(stats.wpm * easeOut(age / COUNT_UP_MS))
      const delta = Math.round(stats.wpm - card.average)

      return (
        <Box flexDirection="column" borderStyle="round" borderColor={accent} borderDimColor={isDim} paddingX={1}>
          <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
            <Text color={tier.color} bold dimColor={isDim}>{`${tier.icon} ${shownWpm} WPM`}</Text>
            <Text dimColor={isDim}>{`⌨  ${formatNumber(stats.cpm)} CPM`}</Text>
            <Text dimColor={isDim}>{`🎯 ${Math.round(stats.accuracy * 100)}%`}</Text>
            <Text dimColor={isDim}>{`⏱ ${formatDuration(stats.activeMs)}`}</Text>
            <Text dimColor={isDim}>{`📝 ${stats.words} words`}</Text>
            {stats.pastedChars > 0 && <Text dimColor>{`📋 +${formatNumber(stats.pastedChars)} pasted`}</Text>}
          </Box>
          {card.isNewBest ? (
            <Text color={accent} bold>
              {`${pick(SPARKLES, ticks)} New personal best! ${
                card.previousBest > 0 ? `${Math.round(card.previousBest)} → ${Math.round(stats.wpm)} WPM` : 'First record set'
              } ${pick(SPARKLES, ticks + 3)}`}
            </Text>
          ) : (
            <Box flexDirection="row" columnGap={1}>
              <Text color={tier.color} italic dimColor={isDim}>{tier.label}</Text>
              <Text color={delta >= 0 ? '#9ece6a' : '#f7768e'} dimColor={isDim}>
                {`${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)}`}
              </Text>
              <Text dimColor>{`vs your ${Math.round(card.average)} WPM average · 🏆 ${Math.round(book.allTime.bestWpm)}`}</Text>
            </Box>
          )}
        </Box>
      )
    }

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const [now, sessionTotals] = await Promise.all([$.clock.now(), read($, session)])
    const all = book.allTime

    if (all.prompts === 0) {
      return (
        <Box flexDirection="column">
          <Text bold>⌨  Nothing measured yet</Text>
          <Text dimColor>Type a prompt of 10 or more characters and press Enter.</Text>
        </Box>
      )
    }

    const average = averageWpm(all)
    const tier = tierOf(average)
    const accuracy = Math.round(Math.max(0, 1 - all.deletedChars / Math.max(1, all.typedChars)) * 100)
    const week = lastDays(dayKey, now, 7)
    const weekWpm = week.map(d => (book.days[d] ? averageWpm(book.days[d]!) : 0))
    const weekMax = Math.max(1, ...weekWpm)
    const barCells = Math.max(6, Math.min(24, (e.viewport?.columns ?? 60) - 34))

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="column">
          <Text color={tier.color} bold>{`${tier.icon}  ${Math.round(average)} WPM average · ${tier.label}`}</Text>
          <Text dimColor>
            {`🏆 best ${Math.round(all.bestWpm)}  🎯 ${accuracy}%  📝 ${formatNumber(all.words)} words  ⏱ ${formatDuration(all.activeMs)}  ✉ ${all.prompts} prompts`}
          </Text>
        </Box>

        <Box flexDirection="column">
          <Text bold>Last 7 days</Text>
          {week.map((d, i) => {
            const wpm = weekWpm[i] ?? 0
            const filled = Math.round((wpm / weekMax) * barCells)
            const totals = book.days[d]
            return (
              <Box key={d} flexDirection="row" columnGap={1}>
                <Text dimColor>{weekdayOf(d)}</Text>
                <Box flexDirection="row">
                  {filled > 0 && <Text color={tierOf(wpm).color}>{'█'.repeat(filled)}</Text>}
                  {filled < barCells && <Text dimColor>{'·'.repeat(barCells - filled)}</Text>}
                </Box>
                <Text dimColor={!totals}>{totals ? `${Math.round(wpm)} WPM · ${totals.prompts} prompts` : '—'}</Text>
              </Box>
            )
          })}
        </Box>

        {book.recent.length > 1 && (
          <Box flexDirection="column">
            <Text bold>Recent prompts</Text>
            <Text color={tier.color}>{sparkline(book.recent, GAUGE_MAX_WPM)}</Text>
            <Text dimColor>{`last ${book.recent.length}, oldest → newest`}</Text>
          </Box>
        )}

        <Box flexDirection="column">
          <Text bold>This session</Text>
          <Text dimColor>{formatTotals(sessionTotals)}</Text>
        </Box>
      </Box>
    )
  })
}
