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

**`/typing`** opens a stats pane: your average and best, accuracy, words and time typed, a bar chart of the last 7 days and a sparkline of your recent prompts. `/typing reset` clears everything.

## How it measures

- **WPM** is the standard measure: typed characters ÷ 5 ÷ minutes.
- **Pastes are not typing.** An insertion of 8 or more characters at once (a paste, a history recall) is shown as pasted and left out.
- **Thinking time is not typing.** A pause of more than 5 seconds between keys is left out of the clock.
- **Accuracy** is 1 − deleted ÷ typed characters.
- **Slash command names are not typing.** In `/btw why is this slow?` only the arguments are measured; a bare command such as `/clear` is not measured at all.
- Prompts shorter than 10 typed characters and prompts you did not type are not measured.

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

A mod runs with your permissions, so check before you install one. This mod reads the clock, keeps its numbers in its own store, registers `/typing` and draws in the interface. It does not read or write files, start processes, use the network or read environment variables. To verify it yourself:

```
claude plugin validate ./plugins/typing-speed
```

## Develop

```
claude --plugin-dir ./plugins/typing-speed   # load it for one session
claude plugin test ./plugins/typing-speed    # run the tests
```
