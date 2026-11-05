# Agent Instructions

Read `CONTEXT.md` before changing the project.

## Commits

Format, in English:

```text
<gitmoji> <Imperative subject>
```

Example: `🐛 Fix bonus fruit spawning on the snake`

- Use the Unicode emoji, not the `:shortcode:`.
- Pick the emoji from the [gitmoji](https://gitmoji.dev) list that best fits the change.
- Start the subject with a capital letter, use the imperative mood, and omit the trailing period.
- Keep the subject to 72 characters or fewer. Add a body only to explain why.
- Make one logical change per commit.
- Run `pnpm check` before committing, and do not commit if it fails.
