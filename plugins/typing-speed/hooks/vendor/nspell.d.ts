export type NSpell = {
  correct(word: string): boolean
  suggest(word: string): string[]
  add(word: string): NSpell
  dictionary(dic: string): NSpell
}

export default function nspell(aff: string, dic?: string): NSpell
