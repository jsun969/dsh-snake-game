import {
  BASE_DELAY, BONUS_LIFE, BONUS_MAX_POINTS, BONUS_MAX_WAIT, BONUS_MIN_POINTS, BONUS_MIN_WAIT,
  COLS, MIN_DELAY, ROWS,
} from '../config.js';
import { DIRECTIONS } from './directions.js';

const NO_STORAGE = { readBest: () => 0, writeBest() {} };

/**
 * One game shared by the toolbar button and the floating window.
 * @param {object} [options]
 * @param {() => number} [options.random] - uniform [0, 1) source.
 * @param {{ readBest(): number, writeBest(value: number): void }} [options.storage] - best score persistence.
 * @param {{ setTimeout: typeof setTimeout, clearTimeout: typeof clearTimeout }} [options.timers] - step clock.
 */
export function createGame({ random = Math.random, storage = NO_STORAGE, timers = globalThis } = {}) {
  let state = { open: false, phase: 'ready', score: 0, best: storage.readBest(), notice: null, bonusPoints: null };
  let snake = [];
  let food = null;
  let heading = 'right';
  let turns = [];
  let eaten = 0;
  let bonus = null;
  let bonusWait = 0;
  let timer = undefined;
  const listeners = new Set();
  const frameListeners = new Set();

  function set(patch) {
    state = { ...state, ...patch };
    for (const listener of [...listeners]) listener();
  }

  function emitFrame() {
    for (const listener of [...frameListeners]) listener();
  }

  function stopTimer() {
    if (timer !== undefined) timers.clearTimeout(timer);
    timer = undefined;
  }

  function schedule() {
    stopTimer();
    // Speed follows the snake's growth, so bonus points do not make it faster.
    const delay = Math.max(MIN_DELAY, BASE_DELAY - eaten * 2);
    timer = timers.setTimeout(() => {
      timer = undefined;
      tick();
    }, delay);
  }

  function placeFood(avoid = null) {
    const taken = new Set(snake.map((part) => part.x + part.y * COLS));
    if (avoid !== null) taken.add(avoid.x + avoid.y * COLS);
    const free = [];
    for (let i = 0; i < COLS * ROWS; i++) if (!taken.has(i)) free.push(i);
    if (free.length === 0) return null;
    const index = free[Math.floor(random() * free.length)];
    return { x: index % COLS, y: Math.floor(index / COLS) };
  }

  function nextBonusWait() {
    return BONUS_MIN_WAIT + Math.floor(random() * (BONUS_MAX_WAIT - BONUS_MIN_WAIT + 1));
  }

  function bonusPoints(life) {
    return BONUS_MIN_POINTS + Math.round((BONUS_MAX_POINTS - BONUS_MIN_POINTS) * (life / BONUS_LIFE));
  }

  function layout() {
    const y = Math.floor(ROWS / 2);
    const x = Math.floor(COLS / 4);
    snake = [{ x, y }, { x: x - 1, y }, { x: x - 2, y }];
    heading = 'right';
    turns = [];
    eaten = 0;
    food = placeFood();
    bonus = null;
    bonusWait = nextBonusWait();
  }

  /** Advance the bonus clock one tick; returns the bonus's current value, or null without one. */
  function ageBonus() {
    if (bonus !== null) {
      bonus = { ...bonus, life: bonus.life - 1 };
      if (bonus.life <= 0) {
        bonus = null;
        bonusWait = nextBonusWait();
      }
    } else if (--bonusWait <= 0) {
      const cell = placeFood(food);
      if (cell === null) bonusWait = nextBonusWait();
      else bonus = { ...cell, life: BONUS_LIFE };
    }
    return bonus === null ? null : bonusPoints(bonus.life);
  }

  function finish() {
    stopTimer();
    set({ phase: 'over' });
    emitFrame();
  }

  function tick() {
    if (state.phase !== 'playing') return;
    if (turns.length > 0) heading = turns.shift();
    const step = DIRECTIONS[heading];
    // Leaving through one edge re-enters from the opposite edge.
    const head = {
      x: (snake[0].x + step.x + COLS) % COLS,
      y: (snake[0].y + step.y + ROWS) % ROWS,
    };
    const eats = food !== null && head.x === food.x && head.y === food.y;
    const eatsBonus = bonus !== null && head.x === bonus.x && head.y === bonus.y;
    // The tail vacates its cell on this step unless the snake is growing.
    const body = eats ? snake : snake.slice(0, -1);
    if (body.some((part) => part.x === head.x && part.y === head.y)) return finish();
    snake = [head, ...body];
    let gained = 0;
    if (eats) {
      gained += 1;
      eaten += 1;
      food = placeFood(bonus);
    }
    if (eatsBonus) {
      gained += bonusPoints(bonus.life);
      bonus = null;
      bonusWait = nextBonusWait();
    }
    const points = ageBonus();
    const patch = {};
    if (gained > 0) {
      patch.score = state.score + gained;
      patch.best = Math.max(state.best, patch.score);
      if (patch.best !== state.best) storage.writeBest(patch.best);
    }
    if (points !== state.bonusPoints) patch.bonusPoints = points;
    if (Object.keys(patch).length > 0) set(patch);
    if (eats && food === null) return finish();
    emitFrame();
    schedule();
  }

  function play() {
    set({ phase: 'playing', notice: null });
    schedule();
    emitFrame();
  }

  function start() {
    layout();
    set({ score: 0, bonusPoints: null });
    play();
  }

  function pause() {
    if (state.phase !== 'playing') return;
    stopTimer();
    set({ phase: 'paused' });
  }

  /** Space and click share one meaning in every phase. */
  function primary() {
    if (state.phase === 'playing') pause();
    else if (state.phase === 'paused') play();
    else start();
  }

  /** Secondary pointer action: a click never pauses a running game. */
  function activate() {
    if (state.phase !== 'playing') primary();
  }

  function turn(direction) {
    if (state.phase === 'over') return;
    if (state.phase === 'ready') start();
    else if (state.phase === 'paused') play();
    const last = turns.length > 0 ? turns[turns.length - 1] : heading;
    const delta = DIRECTIONS[direction];
    const current = DIRECTIONS[last];
    if (direction === last || (delta.x === -current.x && delta.y === -current.y)) return;
    if (turns.length < 2) turns.push(direction);
  }

  layout();

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onFrame(listener) {
      frameListeners.add(listener);
      return () => frameListeners.delete(listener);
    },
    getSnapshot: () => state,
    frame: () => ({ snake, food, bonus, heading, phase: state.phase }),
    redraw: emitFrame,
    tick,
    turn,
    pause,
    primary,
    activate,
    setOpen(open) {
      if (!open) pause();
      set(open ? { open } : { open, notice: null });
    },
    /** Pause for an Agent status change and say why; a new run clears it. */
    notify(notice) {
      if (!state.open) return;
      pause();
      set({ notice });
    },
    clearNotice() {
      if (state.notice !== null) set({ notice: null });
    },
    dispose() {
      stopTimer();
      listeners.clear();
      frameListeners.clear();
    },
  };
}
