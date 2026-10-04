import type { On, PromptEditInput, PromptEditResult } from 'claude-code'
import type { Engine, MockClock } from 'claude-code/testing'
import { describe, expect, mock, test } from 'claude-code/testing'

import { SpellChecker, languagesOf, wordsOf } from '../hooks/spell'

const COMPOSER = { kind: 'composer' } as const
const START = Date.UTC(2026, 9, 3, 10)
const TYPO = { color: '#f7768e', underline: true }
const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 12, bodyColumns: 120, scroll: { offset: 0, bodyRows: 12 }, view: {} },
} as const
const MAC_LANGUAGES = '(\n    "en-TR",\n    "tr-TR"\n)\n'

// Small stand-ins for the shipped Hunspell dictionaries, in chunks as the vendor script cuts them.
// English keeps the real compound rules: parsing chunk by chunk breaks them into rules that accept any word.
const EN_AFF = [
  'SET UTF-8',
  'TRY esianrtolcdugmphbyfvkwz',
  'COMPOUNDMIN 1',
  'ONLYINCOMPOUND c',
  'COMPOUNDRULE 2',
  'COMPOUNDRULE n*1t',
  'COMPOUNDRULE n*mp',
  '',
].join('\n')
const DICTIONARIES: Record<string, { aff: string; chunks: string[][] }> = {
  en: { aff: EN_AFF, chunks: [['0/nm', '1/n1', 'the', 'receive', 'measure'], ['my', 'typing', 'speed', 'please']] },
  tr: { aff: 'SET UTF-8\nTRY aeiınrlkdmuytsboüşzgçhğvcöpfj\n', chunks: [['değil', 'yalnız', 'şöyle', 'çalışıyor', 'bu']] },
}

// The test engine raises prompt.edit at run time, but this build's Engine type omits it.
const editPrompt = ($: Engine, e: PromptEditInput) =>
  ($.prompt as unknown as { edit: (e: PromptEditInput) => Promise<PromptEditResult> }).edit(e)

const typeAtEnd = ($: Engine, text: string, inputText: string) =>
  editPrompt($, { origin: COMPOSER, text, cursor: text.length, start: text.length, end: text.length, inputText })

type System = { env?: Record<string, string>; languages?: string | null }

function engineBeneath(on: On, { env = {}, languages = MAC_LANGUAGES }: System = {}) {
  const reads: string[] = []
  const commands: string[][] = []
  mock.env(on, env)
  on('ui.invalidate', () => ({ value: undefined }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.log', () => ({ value: undefined }))
  on('prompt.edit', (_$, e) => ({
    text: e.text.slice(0, e.start) + e.inputText + e.text.slice(e.end),
    cursor: e.start + e.inputText.length,
  }))
  on('prompt.submit', (_$, e) => ({ text: e.text }))
  on('ui.render', { component: 'AbovePrompt' }, ($, e) => $.ui.resolve(e).Box({}))
  on('process.run', (_$, e) => {
    commands.push([...e.argv])
    if (languages === null) throw new Error(`${e.argv[0]}: command not found`)
    return { value: { exitCode: 0, stdout: languages, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('fs.read', (_$, e) => {
    reads.push(e.path)
    const [, lang, file] = /\/dictionaries\/(\w+)\/(.+)$/.exec(e.path) ?? []
    const dictionary = DICTIONARIES[lang ?? '']
    if (!dictionary) throw new Error(`ENOENT: ${e.path}`)
    if (file === 'index.aff') return { value: dictionary.aff }
    const words = dictionary.chunks[Number(file?.replace('.dic', ''))] ?? []
    return { value: `${words.length}\n${words.map(w => `${w}\n`).join('')}` }
  })
  return { reads, commands }
}

// mock.store's own, but readable from the test: what the mod keeps across sessions.
function memoryStore(on: On, entries: Record<string, unknown> = {}) {
  const store = new Map(Object.entries(entries))
  on('store.get', (_$, e) => ({ value: store.get(e.key) }))
  on('store.set', (_$, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('store.delete', (_$, e) => {
    store.delete(e.key)
    return { value: undefined }
  })
  on('store.keys', () => ({ value: [...store.keys()] }))
  return store
}

const spell = async ($: Engine, args = '') =>
  (
    await $.command.run({
      command: 'typing',
      args: `spell ${args}`.trim(),
      origin: COMPOSER,
      presentation: { isFullscreen: false, columns: 80 },
    })
  ).text

async function type($: Engine, clock: MockClock, chars: string, msPerKey: number) {
  let text = ''
  for (const ch of chars) {
    await typeAtEnd($, text, ch)
    text += ch
    await clock.advance(msPerKey)
  }
  return text
}

describe('words worth spelling', () => {
  test('code, paths, flags, identifiers and the word being typed are left out', () => {
    const text = '`recieve` src/recieve.ts --recieve useRecieve API foo_bar v2 @recieve http://x.io recieve, wel-done recie'
    expect(wordsOf(text, text.length).map(w => w.word)).toEqual(['recieve', 'wel', 'done'])
  })

  test('offsets point at the word inside its punctuation', () => {
    const text = '("recieve"!) ok'
    const [word] = wordsOf(text, -1)
    expect(text.slice(word!.start, word!.end)).toBe('recieve')
  })

  test('suggestions put swapped letters first, then the system language', () => {
    const english = { correct: () => false, suggest: (w: string) => (w === 'recieve' ? ['relieve', 'receive'] : []) }
    const turkish = { correct: () => false, suggest: (w: string) => (w === 'yanlız' ? ['yalız', 'yalnız'] : ['receiver']) }
    const checker = new SpellChecker([turkish, english], ['tr', 'en'])
    expect(checker.suggest('recieve')).toEqual(['receive', 'relieve', 'receiver'])
    expect(checker.suggest('yanlız')).toEqual(['yalnız', 'yalız'])
  })

  test('system locale lists become supported languages, English always among them', () => {
    expect(languagesOf([MAC_LANGUAGES])).toEqual(['en', 'tr'])
    expect(languagesOf(['tr_TR.UTF-8'])).toEqual(['tr', 'en'])
    expect(languagesOf(['tr-TR\r\ntr-TR\r\nen-US\r\n'])).toEqual(['tr', 'en'])
    expect(languagesOf(['de:fr', 'C.UTF-8', 'POSIX'])).toEqual(['en'])
  })
})

test('finished misspelled words are underlined in English and Turkish alike', async ($, on) => {
  mock.clock(on, { now: START })
  const store = memoryStore(on)
  engineBeneath(on)
  expect(await spell($)).toMatch(/on · en, tr/)

  const box = await typeAtEnd($, 'yanlız değil recieve', ' ')
  expect(box.decorations).toEqual([
    { start: 0, end: 6, ...TYPO },
    { start: 13, end: 20, ...TYPO },
  ])

  // The caret is still in "recie": it is not marked until the word is done.
  const typing = await typeAtEnd($, 'şöyle çalışıyor recie', 'v')
  expect(typing.decorations).toBeUndefined()
})

test('a pause shows suggestions for the typos in the band', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  const store = memoryStore(on)
  engineBeneath(on)
  await spell($)

  await typeAtEnd($, 'yanlız recieve', ' ')
  await clock.advance(300)
  const early = await $.ui.mount({ plugin: 'typing-speed', surface: 'terminal', ...BAND })
  expect(await early.find({ type: 'Text', text: 'yalnız' })).toBeUndefined()
  await early.unmount()
  await clock.advance(500)

  const ui = await $.ui.mount({ plugin: 'typing-speed', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: 'yanlız' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'yalnız' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: 'receive' })).toBeDefined()
  await ui.unmount()
})

test('the result card counts the typos of the prompt', async ($, on) => {
  const clock = mock.clock(on, { now: START })
  const store = memoryStore(on)
  engineBeneath(on)
  await spell($)

  const text = await type($, clock, 'please recieve my typing', 240)
  await $.prompt.submit({ text, wait: false, origin: COMPOSER })
  await clock.advance(1_000)

  const ui = await $.ui.mount({ plugin: 'typing-speed', surface: 'terminal', ...BAND })
  expect(await ui.find({ type: 'Text', text: '✗ 1 typo' })).toBeDefined()
  await ui.unmount()
})

test('spell check turns off and on, and remembers it', async ($, on) => {
  mock.clock(on, { now: START })
  const store = memoryStore(on)
  engineBeneath(on)
  await spell($)

  expect(await spell($, 'off')).toMatch(/Spell check off/)
  expect((await typeAtEnd($, 'yanlız recieve', ' ')).decorations).toBeUndefined()
  expect(store.get('spellCheck')).toBe(false)

  expect(await spell($, 'on')).toMatch(/on · en, tr/)
  expect((await typeAtEnd($, 'yanlız recieve', ' ')).decorations).toHaveLength(2)
  expect(store.get('spellCheck')).toBe(true)
})

test('spell check that was turned off stays off and loads no dictionaries', async ($, on) => {
  mock.clock(on, { now: START })
  memoryStore(on, { spellCheck: false })
  const { reads, commands } = engineBeneath(on)

  expect(await spell($)).toMatch(/is off/)
  expect((await typeAtEnd($, 'yanlız recieve', ' ')).decorations).toBeUndefined()
  expect(reads).toEqual([])
  expect(commands).toEqual([])
})

test('a word of your own is not marked, and is kept', async ($, on) => {
  mock.clock(on, { now: START })
  const store = memoryStore(on)
  engineBeneath(on)
  await spell($)

  expect(await spell($, 'add Recieve')).toMatch(/now in your dictionary/)
  expect((await typeAtEnd($, 'yanlız recieve', ' ')).decorations).toEqual([{ start: 0, end: 6, ...TYPO }])
  expect(store.get('personalWords')).toEqual(['recieve'])

  await spell($, 'remove recieve')
  expect((await typeAtEnd($, 'yanlız recieve', ' ')).decorations).toHaveLength(2)
  expect(await spell($, 'add')).toMatch(/^Usage/)
})

test('on Windows the languages come from PowerShell', async ($, on) => {
  mock.clock(on, { now: START })
  const store = memoryStore(on)
  const { commands } = engineBeneath(on, { env: { OS: 'Windows_NT' }, languages: 'tr-TR\r\ntr-TR\r\n' })

  expect(await spell($)).toMatch(/on · tr, en/)
  expect(commands[0]?.[0]).toBe('powershell.exe')
})

test('on Linux the languages come from the locale variables', async ($, on) => {
  mock.clock(on, { now: START })
  const store = memoryStore(on)
  const { reads } = engineBeneath(on, { env: { LANG: 'tr_TR.UTF-8' }, languages: null })

  expect(await spell($)).toMatch(/on · tr, en/)
  expect(reads.some(path => path.endsWith('/dictionaries/tr/index.aff'))).toBe(true)
})

test('a system language without a dictionary falls back to English', async ($, on) => {
  mock.clock(on, { now: START })
  const store = memoryStore(on)
  const { reads } = engineBeneath(on, { env: { LANG: 'de_DE.UTF-8' }, languages: null })

  expect(await spell($)).toMatch(/on · en ·/)
  expect(reads.some(path => path.includes('/dictionaries/tr/'))).toBe(false)
})
