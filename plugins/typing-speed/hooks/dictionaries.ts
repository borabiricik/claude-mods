// Written by scripts/vendor-spell.mjs: the dictionaries under dictionaries/ and their chunk counts.
export const DICTIONARY_CHUNKS = {"en":2,"tr":18} as const

export type Language = keyof typeof DICTIONARY_CHUNKS
