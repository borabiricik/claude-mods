# claude-mods

[Claude Code mods](https://code.claude.com/docs/en/plugins/mods/overview) by Bora Biricik, published as a plugin marketplace.

| Mod | What it does |
| --- | --- |
| [typing-speed](plugins/typing-speed) | A live typing speedometer above the prompt, a result card after each prompt (WPM, CPM, accuracy, personal bests) and a `/typing` stats pane |

## Install

Requires Claude Code v2.1.287 or later.

```
claude plugin marketplace add borabiricik/claude-mods
claude plugin install typing-speed@borabiricik-mods
```

A mod runs inside Claude Code with your permissions. Each mod's README says what it can reach, and `claude plugin validate <mod folder>` lists every event it hooks and every call it makes.

## License

[MIT](LICENSE)
