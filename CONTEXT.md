# Project Context

A DeepSeek Harness (DSH) Client plugin. Client source in `src/` is bundled into a single module inside the installable bundle `dsh-snake/`.

## Layout

```text
src/
  index.jsx              plugin entry: inject, apply, slot registrations
  config.js              all tunable values (board, speed, bonus fruit, window, storage keys)
  i18n.js                UI strings and locale registration
  storage.js             localStorage wrapper for best score and window position
  game/engine.js         game rules, no DOM
  game/directions.js     directions and key bindings
  game/geometry.js       window clamping and board sizing
  view/Card.jsx          floating game window
  view/Toggle.jsx        toolbar button; also watches the agent status
  view/useDrag.js        drag-to-move hook
  view/draw.js           canvas rendering
  view/icons.jsx         inline SVG icons
  view/styles/*.css      component styles, bundled as text
dsh-snake/               the bundle DSH links to
  client.js              build output, git-ignored
  index.js               Host half, intentionally empty
  cordis.patch.yml       bundle patch
  locale/, icon.svg      Plugin Manager metadata
scripts/build.mjs        esbuild bundle to DSH module-loader format
test/                    node:test suites (engine, geometry, storage, built bundle)
```

## Commands

```sh
pnpm build     # write dsh-snake/client.js
pnpm watch     # rebuild on change
pnpm test      # unit tests + built-bundle smoke test; needs a prior build
pnpm check     # build, syntax-check the bundle, test
just publish   # pnpm check, then publish dsh-snake/ to npm as @jsun969/dsh-snake
```

To try a build in a running DSH, follow "Update a source install" in `README.md`.

`pnpm publish` refuses to run unless the tree is clean and `main` matches `origin/main`. Bump `version` in `dsh-snake/package.json` before each release.

## Build

`scripts/build.mjs` runs esbuild (CJS, browser, ES2022) and wraps the output in `window.__ModuleLoader__.load({ id, factory(require) })`, with `id` taken from `dsh-snake/package.json`.

`react` stays external because the DSH module loader supplies it through `require`. CSS imports load as text and render through `<style>` elements.

## Architecture

**Wiring.** `apply(ctx)` in `src/index.jsx` creates one game, then registers two slots that share it through a `runtime` object:

- `shell.overlay` (id `dsh-snake`): the floating window, rendered only while the game is open.
- `conversation.input.left` (id `dsh-snake-toggle`): the toolbar button.

The overlay layer has no Session scope, so `Toggle` is what watches the agent. It reads `useSessionStatus`, reduces it to `running`, `pending` or `idle`, and calls `game.notify` or `game.clearNotice` on changes within the same Session.

**Engine.** `createGame` takes `random`, `storage` and `timers` as injected options, which is how the tests run it deterministically. It publishes on two channels:

- `subscribe` / `getSnapshot`: React state (`open`, `phase`, `score`, `best`, `notice`, `bonusPoints`), read with `useSyncExternalStore`.
- `onFrame` / `frame()`: canvas data (`snake`, `food`, `bonus`, `heading`, `phase`), drawn without a React render.

**Phases.** `ready`, `playing`, `paused`, `over`.

- `primary()` is the keyboard action and toggles pause. `activate()` is the pointer action and never pauses a running game.
- `turn()` queues at most 2 turns and drops reversals and repeats, measured against the last queued direction.
- Step delay depends on `eaten` (plain fruit only), so bonus points never change the speed.
- The tail's cell counts as free on a non-growing step, so a snake can chase its own tail.
- `notify()` does nothing while the window is closed, and closing clears any notice.

**Storage.** `createStorage` swallows read and write failures; values then last for the page only. Malformed values read as defaults.

**i18n.** Namespace `local-snake`. `EN` is registered as `en`, and `ZH` for every locale whose id starts with `zh`. `dsh-snake/locale/*.json` only holds the Plugin Manager title and description; UI strings live in `src/i18n.js`.

## Rules

- Never edit `dsh-snake/client.js`; change `src/` and rebuild.
- Keep `src/game/` free of DOM and React. Time, randomness and persistence go through the injected options.
- Put tunable values in `src/config.js`, not inline.
- Add every UI string to both `EN` and `ZH`.
- `test/bundle.test.js` asserts the exact slot registrations, the `inject` list and that `react` is the only required module. Update it when those change on purpose.
- When changing `inject` in `src/index.jsx`, check whether `dsh.client.inject` in `dsh-snake/package.json` must change too.
