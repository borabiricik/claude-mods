export type Totals = {
  prompts: number
  typedChars: number
  pastedChars: number
  deletedChars: number
  words: number
  activeMs: number
  bestWpm: number
}

export type PromptStats = {
  typedChars: number
  pastedChars: number
  deletedChars: number
  words: number
  activeMs: number
  wpm: number
  cpm: number
  accuracy: number
}

declare module 'claude-code' {
  interface PluginState {
    'typing-speed': { session: Totals; last: PromptStats | null }
  }
}
