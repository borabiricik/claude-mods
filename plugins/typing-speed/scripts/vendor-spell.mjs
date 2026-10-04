#!/usr/bin/env node
// Vendors nspell and the Hunspell dictionaries the spell check ships.
//
// A hooks module cannot resolve npm packages and each module file is capped at 1 MiB,
// so nspell is bundled into one ES module and every dictionary is cut into chunks that
// the mod reads with $.fs.read at run time.
//
//   node plugins/typing-speed/scripts/vendor-spell.mjs

import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const PLUGIN = join(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGES = { nspell: '2.1.5', esbuild: '0.28.2' }
// Only permissively licensed dictionaries that nspell loads in about a second.
const DICTIONARIES = { en: '4.0.0', tr: '2.0.0' }
const CHUNK_BYTES = 512 * 1024

const work = mkdtempSync(join(tmpdir(), 'typing-speed-vendor-'))
try {
  const specs = [
    ...Object.entries(PACKAGES).map(([name, version]) => `${name}@${version}`),
    ...Object.entries(DICTIONARIES).map(([lang, version]) => `dictionary-${lang}@${version}`),
  ]
  execFileSync('npm', ['install', '--prefix', work, '--no-save', '--no-audit', '--no-fund', ...specs], { stdio: 'inherit' })

  const entry = join(work, 'entry.js')
  writeFileSync(entry, "export { default } from 'nspell'\n")
  const vendor = join(PLUGIN, 'hooks', 'vendor')
  mkdirSync(vendor, { recursive: true })
  execFileSync(join(work, 'node_modules', '.bin', 'esbuild'), [
    entry,
    '--bundle',
    '--format=esm',
    '--platform=neutral',
    '--main-fields=main',
    '--legal-comments=none',
    `--outfile=${join(vendor, 'nspell.js')}`,
  ])
  const bundle = readFileSync(join(vendor, 'nspell.js'), 'utf8')
  writeFileSync(
    join(vendor, 'nspell.js'),
    `// nspell ${PACKAGES.nspell} (MIT, https://github.com/wooorm/nspell), bundled by scripts/vendor-spell.mjs.\n${bundle}`,
  )
  copyFileSync(join(work, 'node_modules', 'nspell', 'license'), join(vendor, 'nspell.license'))

  const chunks = {}
  for (const lang of Object.keys(DICTIONARIES)) {
    const source = join(work, 'node_modules', `dictionary-${lang}`)
    const target = join(PLUGIN, 'dictionaries', lang)
    rmSync(target, { recursive: true, force: true })
    mkdirSync(target, { recursive: true })
    copyFileSync(join(source, 'index.aff'), join(target, 'index.aff'))
    copyFileSync(join(source, 'license'), join(target, 'license'))

    // nspell skips a dictionary's first line (the word count), so every chunk starts with one.
    const lines = readFileSync(join(source, 'index.dic'), 'utf8').split('\n').slice(1).filter(Boolean)
    let count = 0
    let current = []
    let bytes = 0
    const flush = () => {
      writeFileSync(join(target, `${count}.dic`), `${current.length}\n${current.join('\n')}\n`)
      count += 1
      current = []
      bytes = 0
    }
    for (const line of lines) {
      current.push(line)
      bytes += Buffer.byteLength(line) + 1
      if (bytes >= CHUNK_BYTES) flush()
    }
    if (current.length > 0) flush()
    chunks[lang] = count
  }

  writeFileSync(
    join(PLUGIN, 'hooks', 'dictionaries.ts'),
    [
      '// Written by scripts/vendor-spell.mjs: the dictionaries under dictionaries/ and their chunk counts.',
      `export const DICTIONARY_CHUNKS = ${JSON.stringify(chunks)} as const`,
      '',
      'export type Language = keyof typeof DICTIONARY_CHUNKS',
      '',
    ].join('\n'),
  )
  console.log('vendored', chunks)
} finally {
  rmSync(work, { recursive: true, force: true })
}
