/** Tunable values. Gameplay values are in ticks; one tick is one snake step. */

export const COLS = 20;
export const ROWS = 20;

// Step delay in ms; it shortens by 2 ms per plain fruit eaten, down to the minimum.
export const BASE_DELAY = 130;
export const MIN_DELAY = 70;

// Bonus fruit: appears after a random wait, shrinks over its lifetime and is worth less as it shrinks.
export const BONUS_MIN_WAIT = 100;
export const BONUS_MAX_WAIT = 250;
export const BONUS_LIFE = 25;
export const BONUS_MAX_POINTS = 5;
export const BONUS_MIN_POINTS = 1;

// Board cell size in px, fitted to the viewport.
export const MIN_CELL = 8;
export const MAX_CELL = 14;
export const VIEWPORT_MARGIN = 48;
export const CHROME_HEIGHT = 96;

// Floating window placement in px.
export const DRAG_THRESHOLD = 4;
export const EDGE_MARGIN = 8;
export const DEFAULT_RIGHT = 24;
export const DEFAULT_BOTTOM = 170;

export const BEST_KEY = 'dsh-snake.best';
export const POSITION_KEY = 'dsh-snake.position';
