import { DICTIONARY_CHUNKS } from './dictionaries'
import type { Language } from './dictionaries'

export type Word = { start: number; end: number; word: string }
export type Speller = { correct(word: string): boolean; suggest(word: string): string[] }

export const SUPPORTED_LANGUAGES = Object.keys(DICTIONARY_CHUNKS) as Language[]
// Prompts to a coding agent are full of English whatever the system language, so English always loads.
export const BASE_LANGUAGE: Language = 'en'
const CACHE_LIMIT = 10_000
const SUGGESTIONS_KEPT = 3
// nspell's suggestions grow costly with length; a word this long gets none.
const SUGGEST_MAX_LENGTH = 20

const isSupported = (code: string): code is Language => (SUPPORTED_LANGUAGES as string[]).includes(code)

// Locale lists as the platforms print them: `("en-TR", "tr-TR")`, `tr_TR.UTF-8`, `tr:en`, one per line.
export function languagesOf(locales: readonly string[]): Language[] {
  const found: Language[] = []
  for (const token of locales.flatMap(l => l.split(/[\s,()":;]+/))) {
    const code = /^[A-Za-z]{2,3}(?![A-Za-z])/.exec(token)?.[0].toLowerCase()
    if (code && isSupported(code) && !found.includes(code)) found.push(code)
  }
  if (!found.includes(BASE_LANGUAGE)) found.push(BASE_LANGUAGE)
  return found
}

// Code spans and fences are not prose.
function codeRanges(text: string): [number, number][] {
  return [...text.matchAll(/```[\s\S]*?(?:```|$)|`[^`\n]*(?:`|$)/g)].map(m => [m.index, m.index + m[0].length])
}

const LEADING = /^["'([{<«“‘]+/
const TRAILING = /["')\]}>»”’.,;:!?…]+$/
// Paths, flags, identifiers, numbers, mentions, URLs and file names: not words to spell.
const CODE_LIKE = /[\d_/\\@#$%^&*=+<>{}[\]|~`:]|\.\p{L}|^-/u
const WORD_SHAPE = /^[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*$/u

// The words of a draft worth spelling, leaving out the one the caret is still in.
export function wordsOf(text: string, cursor: number): Word[] {
  const code = codeRanges(text)
  const words: Word[] = []
  for (const chunk of text.matchAll(/\S+/g)) {
    const start = chunk.index
    const end = start + chunk[0].length
    if (cursor >= start && cursor <= end) continue
    if (code.some(([s, e]) => start < e && end > s)) continue

    const lead = LEADING.exec(chunk[0])?.[0].length ?? 0
    const core = chunk[0].slice(lead).replace(TRAILING, '')
    if (core === '' || CODE_LIKE.test(core)) continue

    let offset = start + lead
    for (const part of core.split(/[-–—]/)) {
      const isWord = part.length >= 2 && WORD_SHAPE.test(part)
      const isCamelCase = /\p{Ll}\p{Lu}/u.test(part)
      const isAcronym = /^\p{Lu}+$/u.test(part)
      if (isWord && !isCamelCase && !isAcronym) words.push({ start: offset, end: offset + part.length, word: part })
      offset += part.length + 1
    }
  }
  return words
}

const turkishLower = (word: string) => word.replace(/I/g, 'ı').replace(/İ/g, 'i').toLowerCase()

function variantsOf(word: string): string[] {
  const straight = word.replace(/’/g, "'")
  return [...new Set([word, straight, straight.toLowerCase(), turkishLower(straight)])]
}

// Edit distance with swapped neighbours at half cost: the typo fingers make most (recieve, yanlız).
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const row = rows[i]!
      const above = rows[i - 1]!
      row[j] = Math.min(above[j]! + 1, row[j - 1]! + 1, above[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1))
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        row[j] = Math.min(row[j]!, rows[i - 2]![j - 2]! + 0.5)
      }
    }
  }
  return rows[a.length]![b.length]!
}

export class SpellChecker {
  private readonly known = new Map<string, boolean>()
  private readonly suggestions = new Map<string, string[]>()
  private readonly personal: Set<string>

  constructor(
    private readonly spellers: readonly Speller[],
    readonly languages: readonly Language[],
    personal: Iterable<string> = [],
  ) {
    this.personal = new Set([...personal].map(w => w.toLowerCase()))
  }

  get personalWords(): string[] {
    return [...this.personal].sort()
  }

  learn(word: string) {
    this.personal.add(word.toLowerCase())
    this.known.clear()
  }

  forget(word: string) {
    this.personal.delete(word.toLowerCase())
    this.known.clear()
  }

  isCorrect(word: string): boolean {
    let isKnown = this.known.get(word)
    if (isKnown === undefined) {
      isKnown = this.lookUp(word)
      if (this.known.size >= CACHE_LIMIT) this.known.clear()
      this.known.set(word, isKnown)
    }
    return isKnown
  }

  misspelled(text: string, cursor: number): Word[] {
    return wordsOf(text, cursor).filter(w => !this.isCorrect(w.word))
  }

  hasSuggested(word: string): boolean {
    return this.suggestions.has(word) || word.length > SUGGEST_MAX_LENGTH
  }

  suggest(word: string): string[] {
    const cached = this.suggestions.get(word)
    if (cached) return cached
    if (word.length > SUGGEST_MAX_LENGTH) return []
    const seen = new Set<string>()
    const ranked = this.spellers
      .flatMap((s, rank) => s.suggest(word).map(candidate => ({ candidate, rank })))
      .filter(({ candidate }) => !seen.has(candidate) && seen.add(candidate))
      .map(s => ({ ...s, cost: distance(word.toLowerCase(), s.candidate.toLowerCase()) }))
      .sort((a, b) => a.cost - b.cost || a.rank - b.rank)
      .slice(0, SUGGESTIONS_KEPT)
      .map(s => s.candidate)
    if (this.suggestions.size >= CACHE_LIMIT) this.suggestions.clear()
    this.suggestions.set(word, ranked)
    return ranked
  }

  private lookUp(word: string): boolean {
    if (this.personal.has(word.toLowerCase())) return true
    if (variantsOf(word).some(v => this.spellers.some(s => s.correct(v)))) return true
    // Turkish puts a proper name's suffix after an apostrophe: Claude'un, Ankara'da.
    const apostrophe = word.search(/['’]/)
    return apostrophe > 0 && /^\p{Lu}/u.test(word)
  }
}
