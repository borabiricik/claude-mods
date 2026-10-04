# Typing Speed

A [Claude Code mod](https://code.claude.com/docs/en/plugins/mods/overview) that measures how fast you type your prompts.

## What you get

**While you type**, a live speedometer above the prompt:

```
⣾ 🏃  58 WPM ▰▰▰▰▰▰▱▱▱▱▱▱ ▂▃▅▆▅▇▆ Quick  ⏱ 12s  ✎ 142  🎯 98%
```

The icon, colour and label follow your speed: 🐢 Warming up, 🚶 Steady, 🏃 Quick, 🚀 Rocket, 🔥 On fire, ⚡ Lightning.

**After you press Enter**, a result card that counts up to your speed and celebrates a new personal best:

```
╭──────────────────────────────────────────────────────────╮
│ 🚀 72 WPM  ⌨  360 CPM  🎯 96%  ⏱ 23s  📝 27 words          │
│ ✦ New personal best! 68 → 72 WPM ✧                        │
╰──────────────────────────────────────────────────────────╯
```

**Spell check**, offline, in your system language. A misspelled word is underlined in red in the prompt once you have finished it, and when you pause, the band suggests fixes:

```
✗  yanlız → yalnız   recieve → receive
```

The card counts the typos of each prompt (`✗ 2 typos` or `✓ no typos`).

**`/typing`** opens a stats pane: your average and best, accuracy, words and time typed, a bar chart of the last 7 days and a sparkline of your recent prompts. `/typing reset` clears everything.

## How it measures

- **WPM** is the standard measure: typed characters ÷ 5 ÷ minutes.
- **Pastes are not typing.** An insertion of 8 or more characters at once (a paste, a history recall) is shown as pasted and left out.
- **Thinking time is not typing.** A pause of more than 5 seconds between keys is left out of the clock.
- **Accuracy** is 1 − deleted ÷ typed characters.
- **Slash command names are not typing.** In `/btw why is this slow?` only the arguments are measured; a bare command such as `/clear` is not measured at all.
- Prompts shorter than 10 typed characters and prompts you did not type are not measured.

## Spell check

- **Languages** come from the system: macOS's preferred languages (`defaults read -g AppleLanguages`), Windows's display and input languages (PowerShell), and `LANGUAGE`, `LC_ALL`, `LC_MESSAGES` and `LANG` everywhere. English and Turkish dictionaries ship with the mod; English always loads, since prompts to a coding agent are full of it. A system language without a dictionary falls back to English.
- **Left out:** `code spans` and fences, paths, URLs, flags, file names, `camelCase` and `snake_case` identifiers, acronyms, words with digits, `@mentions`, slash command names, and the word you are still typing. A capitalized word followed by an apostrophe (`Claude'un`, `İstanbul'da`) counts as a name.
- **`/typing spell off`** turns it off and **`/typing spell on`** back on; the choice is kept. **`/typing spell`** says what it is checking with.
- **`/typing spell add <word>`** teaches it a word, **`/typing spell remove <word>`** forgets one.
- It runs on [nspell](https://github.com/wooorm/nspell) with the Hunspell dictionaries of [wooorm/dictionaries](https://github.com/wooorm/dictionaries), all bundled: no network and no service. The dictionaries load in the background in about a second when a session starts.
- The Turkish dictionary does not know every suffix chain, so some long correct words (`kitaplıklarımızdan`) are underlined; add the ones you use with `/typing spell add`.

Stats are kept in the mod's own store: all time, the last 30 days and your last 30 prompts.

## Install

Requires Claude Code v2.1.287 or later.

```
claude plugin marketplace add borabiricik/claude-mods
claude plugin install typing-speed@borabiricik-mods
```

Or inside a session: `/plugin install typing-speed --marketplace borabiricik/claude-mods`. Run `/reload-plugins` if a session was already open.

The band and pane draw in the terminal and in the Desktop app's Code tab.

## What it can reach

A mod runs with your permissions, so check before you install one. This mod reads the clock, keeps its numbers in its own store, registers `/typing` and draws in the interface. For spell check it also reads its own dictionary files, reads the `OS`, `LANGUAGE`, `LC_ALL`, `LC_MESSAGES` and `LANG` environment variables, and runs one command when a session starts to learn the system languages (`defaults read -g AppleLanguages`, or `powershell.exe` on Windows). With spell check off it does none of that. It writes no files and does not use the network. To verify it yourself:

```
claude plugin validate ./plugins/typing-speed
```

## Develop

```
claude --plugin-dir ./plugins/typing-speed   # load it for one session
claude plugin test ./plugins/typing-speed    # run the tests
node plugins/typing-speed/scripts/vendor-spell.mjs   # re-vendor nspell and the dictionaries
```

A hooks module cannot import npm packages and each module file is capped at 1 MiB, so `scripts/vendor-spell.mjs` bundles nspell into `hooks/vendor/nspell.js` and cuts each dictionary into chunks under `dictionaries/`, which the mod reads at run time. The dictionaries keep their own licenses (`dictionaries/*/license`).
