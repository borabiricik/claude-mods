import type { On, PromptEditInput, PromptEditResult } from 'claude-code'
import type { Engine, MockClock } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'

const COMPOSER = { kind: 'composer' } as const
const START = Date.UTC(2026, 9, 3, 10)
const SURFACES = ['terminal', 'desktop'] as const
const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 120, scroll: { offset: 0, bodyRows: 12 }, view: {} },
} as const

// The test engine raises prompt.edit at run time, but this build's Engine type omits it.
const editPrompt = ($: Engine, e: PromptEditInput) =>
  ($.prompt as unknown as { edit: (e: PromptEditInput) => Promise<PromptEditResult> }).edit(e)

function engineBeneath(on: On) {
  const statuses: (string | undefined)[] = []
  on('ui.status', (_$, e) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.invalidate', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('prompt.edit', (_$, e) => ({
    text: e.text.slice(0, e.start) + e.inputText + e.text.slice(e.end),
    cursor: e.start + e.inputText.length,
  }))
  on('prompt.submit', (_$, e) => ({ text: e.text }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => $.ui.resolve(e).Box({}))
  return { statuses }
}

async function cardWpm($: Engine) {
  const ui = await $.ui.mount({ plugin: 'typing-speed', surface: 'terminal', ...BAND })
  const node = await ui.find({ type: 'Text', text: / WPM$/ })
  await ui.unmount()
  return node?.text.replace(/^\S+ /, '')
}

async function type($: Engine, clock: MockClock, draft: string, chars: string, msPerKey: number) {
  let text = draft
  for (const ch of chars) {
    await editPrompt($, { origin: COMPOSER, key: { key: ch }, text, cursor: text.length, start: text.length, end: text.length, inputText: ch })
    text += ch
    await clock.advance(msPerKey)
  }
  return text
}

test('a typed prompt is measured into the all-time average', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  mock.store(on)
  const { statuses } = engineBeneath(on)

  // 25 keys 240 ms apart: 24 gaps, 5.76 s, so 25 / 5 words / 0.096 min ≈ 52 WPM.
  const text = await type($, clock, '', 'measure my typing speed!!', 240)
  await $.prompt.submit({ text, wait: false, origin: COMPOSER })

  await clock.advance(1_000)
  expect(await cardWpm($)).toBe('52 WPM')
  expect(statuses.length).toBe(0)
})

test('pastes and thinking pauses are left out of the speed', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  mock.store(on)
  const { statuses } = engineBeneath(on)

  let text = await type($, clock, '', 'first half ', 240)
  await clock.advance(30_000)
  const paste = 'a long pasted stack trace'
  await editPrompt($, { origin: COMPOSER, text, cursor: text.length, start: text.length, end: text.length, inputText: paste })
  text += paste
  text = await type($, clock, text, ' second half', 240)
  await $.prompt.submit({ text, wait: false, origin: COMPOSER })

  // 23 typed keys, 21 counted gaps of 240 ms (the 30 s pause and the paste are skipped).
  await clock.advance(1_000)
  expect(await cardWpm($)).toBe('55 WPM')
})

test('a pasted-only prompt is not measured', async ($, on) => {
  mock.clock(on, { now: START })
  mock.store(on)
  engineBeneath(on)

  const paste = 'only pasted text, nothing typed here'
  await editPrompt($, { origin: COMPOSER, text: '', cursor: 0, start: 0, end: 0, inputText: paste })
  await $.prompt.submit({ text: paste, wait: false, origin: COMPOSER })

  expect(await cardWpm($)).toBeUndefined()
})

test('the band shows a live speedometer while typing', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  mock.store(on)
  engineBeneath(on)

  await type($, clock, '', 'measure my typing speed!!', 240)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'typing-speed', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: / 52 WPM/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Quick' })).toBeDefined()
    await ui.unmount()
  }
})

test('the band shows a result card, with a new best on the first prompt, then hides', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  mock.store(on)
  engineBeneath(on)

  const text = await type($, clock, '', 'measure my typing speed!!', 240)
  await $.prompt.submit({ text, wait: false, origin: COMPOSER })
  await clock.advance(1_000)

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({ plugin: 'typing-speed', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: '52 WPM' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /New personal best! First record set/ })).toBeDefined()
    await ui.unmount()
  }

  await clock.advance(10_000)
  const ui = await $.ui.mount({ plugin: 'typing-speed', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: /WPM/ })).toBeUndefined()
})

test('/typing opens a stats pane with the last 7 days', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  mock.store(on, {
    allTime: { prompts: 4, typedChars: 1000, pastedChars: 0, deletedChars: 0, words: 200, activeMs: 240_000, bestWpm: 70 },
  })
  engineBeneath(on)

  const text = await type($, clock, '', 'a quick prompt to measure', 100)
  await $.prompt.submit({ text, wait: false, origin: COMPOSER })
  const result = await $.command.run({
    command: 'typing',
    args: '',
    origin: COMPOSER,
    presentation: { isFullscreen: false, columns: 80 },
  })
  expect(result.text).toBeUndefined()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount({
      plugin: 'typing-speed',
      surface,
      component: 'Pane',
      requestId: 'typing-stats',
      props: { title: '⌨ Typing stats', isFocused: false, bodyColumns: 80, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
      viewport: { columns: 80, rows: 30 },
    })
    expect(await ui.find({ type: 'Text', text: /WPM average/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /🏆 best 125/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: 'Last 7 days' })).toBeDefined()
    await ui.unmount()
  }
})

test('a bare slash command is not measured and shows no speedometer', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  mock.store(on)
  engineBeneath(on)

  const text = await type($, clock, '', '/compact-the-conversation', 240)
  const ui = await $.ui.mount({ plugin: 'typing-speed', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: /WPM/ })).toBeUndefined()
  await ui.unmount()

  await $.prompt.submit({ text, wait: false, origin: COMPOSER })
  await clock.advance(1_000)
  expect(await cardWpm($)).toBeUndefined()
})

test("a slash command's arguments are measured without its name", async ($, on) => {
  const clock = mock.clock(on, { now: START })
  mock.store(on)
  engineBeneath(on)

  // The name is typed slowly; only the 25 argument keys at 240 ms count, as in the plain prompt.
  let text = await type($, clock, '', '/info ', 1_000)
  text = await type($, clock, text, 'measure my typing speed!!', 240)
  await $.prompt.submit({ text, wait: false, origin: COMPOSER })

  await clock.advance(1_000)
  expect(await cardWpm($)).toBe('52 WPM')
})
