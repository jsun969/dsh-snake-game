# Snake for DeepSeek Harness

Play Snake in a floating window of the Harness Web UI while the agent works.
The game pauses when the agent finishes or needs you.

## Install

Requires Node.js and pnpm.

```sh
pnpm install
pnpm build
```

Then install the `dsh-snake/` directory with Plugin Manager (`install_bundle` with its absolute path) and refresh the page.
The install is a link, so keep the directory where it is.

## Update

```sh
git pull
pnpm install
pnpm build
```

Then remove and reinstall the bundle, and refresh the page.

## Play

Open and close the game with the snake button in the composer toolbar.

| Input | Action |
| --- | --- |
| Arrow keys or WASD | Move; also starts or resumes the game |
| Space or Enter | Start, pause, resume, or play again |
| Click the board | Start, resume, or play again |
| Esc | Close the window |

Drag the window to move it. Closing it or moving focus away pauses the game.

- The edges wrap: leaving one side brings you back on the opposite side.
- Each fruit scores 1 point and speeds you up.
- Bonus fruit appears now and then, and is worth 5 points down to 1 as it shrinks. It disappears if you are too slow.
- Your best score and the window position are saved in this browser.
