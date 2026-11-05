import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COLS, ROWS } from '../src/config.js';
import { createGame } from '../src/game/engine.js';

// The step clock is driven by calling tick() directly.
const timers = { setTimeout: () => 1, clearTimeout() {} };
const newGame = (random = () => 0.5) => createGame({ random, timers });
const body = (game) => game.frame().snake;

test('starts on the first turn and moves one cell per tick', () => {
  const game = newGame();
  assert.equal(game.getSnapshot().phase, 'ready');
  game.turn('up');
  assert.equal(game.getSnapshot().phase, 'playing');
  const before = body(game)[0];
  game.tick();
  assert.deepEqual({ ...body(game)[0] }, { x: before.x, y: before.y - 1 });
});

test('ignores a direct reversal', () => {
  const game = newGame();
  game.primary();
  const before = body(game)[0];
  game.turn('left');
  game.tick();
  assert.equal(body(game)[0].x, before.x + 1);
});

test('two quick turns apply on successive ticks', () => {
  const game = newGame();
  game.primary();
  const start = body(game)[0];
  game.turn('up');
  game.turn('left');
  game.tick();
  game.tick();
  assert.deepEqual({ ...body(game)[0] }, { x: start.x - 1, y: start.y - 1 });
});

test('eating grows the snake and raises score and best', () => {
  // random 0 places food in the first free cell, (0, 0); walk there.
  const game = newGame(() => 0);
  game.primary();
  assert.deepEqual({ ...game.frame().food }, { x: 0, y: 0 });
  const length = body(game).length;
  game.turn('up');
  for (let i = 0; body(game)[0].y > 0 && i < 20; i++) game.tick();
  game.turn('left');
  for (let i = 0; body(game)[0].x > 0 && i < 40; i++) game.tick();
  assert.equal(game.getSnapshot().score, 1);
  assert.equal(game.getSnapshot().best, 1);
  assert.equal(body(game).length, length + 1);
});

test('leaving through any edge re-enters from the opposite edge', () => {
  const crossing = (turn, axis, size, entry) => {
    const game = newGame(() => 0.99);
    game.primary();
    if (turn !== null) game.turn(turn);
    const seen = [];
    for (let i = 0; i < size + 1; i++) {
      game.tick();
      seen.push(body(game)[0][axis]);
    }
    assert.equal(game.getSnapshot().phase, 'playing');
    const exit = entry === 0 ? size - 1 : 0;
    const at = seen.indexOf(exit);
    assert.ok(at >= 0 && at < seen.length - 1);
    assert.equal(seen[at + 1], entry);
  };
  crossing(null, 'x', COLS, 0);
  crossing('up', 'y', ROWS, ROWS - 1);
  crossing('down', 'y', ROWS, 0);

  const game = newGame(() => 0.99);
  game.primary();
  game.turn('up');
  game.tick();
  game.turn('left');
  const seen = [];
  for (let i = 0; i < COLS + 1; i++) {
    game.tick();
    seen.push(body(game)[0].x);
  }
  assert.equal(game.getSnapshot().phase, 'playing');
  const exit = seen.indexOf(0);
  assert.ok(exit >= 0 && exit < seen.length - 1);
  assert.equal(seen[exit + 1], COLS - 1);
});

test('a length 3 snake can chase its own tail safely', () => {
  const game = newGame(() => 0.99);
  game.primary();
  for (const direction of ['up', 'left', 'down', 'right']) {
    game.turn(direction);
    game.tick();
  }
  assert.equal(game.getSnapshot().phase, 'playing');
});

test('hitting its own body ends the game', () => {
  // Place each food directly ahead so the snake grows in a straight line along its row.
  let game;
  const random = () => {
    if (game === undefined) return 0;
    const { snake } = game.frame();
    const head = snake[0];
    const target = head.x + 1 + head.y * COLS;
    const below = snake.filter((part) => part.x + part.y * COLS < target).length;
    return (target - below + 0.5) / (COLS * ROWS - snake.length);
  };
  game = newGame(random);
  game.primary();
  while (body(game).length < 5) game.tick();
  assert.equal(game.frame().heading, 'right');
  assert.ok(body(game).every((part) => part.y === body(game)[0].y));

  const trace = [];
  for (const direction of ['up', 'left', 'down']) {
    game.turn(direction);
    game.tick();
    trace.push(direction + ':' + game.getSnapshot().phase);
  }
  assert.deepEqual(trace, ['up:playing', 'left:playing', 'down:over']);

  const atDeath = body(game)[0];
  game.turn('up');
  assert.equal(game.getSnapshot().phase, 'over');
  assert.deepEqual(body(game)[0], atDeath);
  game.primary();
  assert.equal(game.getSnapshot().phase, 'playing');
  assert.equal(game.getSnapshot().score, 0);
});

test('Agent notice pauses, a key resumes and clears it', () => {
  const game = newGame();
  game.setOpen(true);
  game.primary();
  game.notify('done');
  assert.equal(game.getSnapshot().phase, 'paused');
  assert.equal(game.getSnapshot().notice, 'done');
  game.primary();
  assert.equal(game.getSnapshot().phase, 'playing');
  assert.equal(game.getSnapshot().notice, null);
});

test('closing pauses and keeps the game', () => {
  const game = newGame();
  game.setOpen(true);
  game.primary();
  game.tick();
  const head = body(game)[0];
  game.setOpen(false);
  assert.equal(game.getSnapshot().phase, 'paused');
  game.tick();
  assert.deepEqual(body(game)[0], head);
});

test('click never pauses a running game', () => {
  const game = newGame();
  game.activate();
  assert.equal(game.getSnapshot().phase, 'playing');
  game.activate();
  assert.equal(game.getSnapshot().phase, 'playing');
});

test('a notice is ignored while closed and cleared by closing', () => {
  const game = newGame();
  game.notify('done');
  assert.equal(game.getSnapshot().notice, null);
  game.setOpen(true);
  game.notify('pending');
  assert.equal(game.getSnapshot().notice, 'pending');
  game.setOpen(false);
  assert.equal(game.getSnapshot().notice, null);
});


test('bonus fruit appears, shrinks in value, then disappears', () => {
  const game = newGame(() => 0);
  game.primary();
  // random 0 makes the wait the minimum; steer up and down in a column clear of food.
  let ticks = 0;
  while (game.frame().bonus === null && ticks < 400) {
    game.turn(ticks % 2 === 0 ? 'down' : 'right');
    game.tick();
    ticks++;
    assert.equal(game.getSnapshot().phase, 'playing');
  }
  assert.ok(game.frame().bonus !== null, 'bonus never appeared');
  assert.equal(ticks, 100);
  const first = game.getSnapshot().bonusPoints;
  assert.equal(first, 5);
  const values = [first];
  for (let i = 0; i < 60 && game.frame().bonus !== null; i++) {
    game.turn(i % 2 === 0 ? 'down' : 'right');
    game.tick();
    if (game.getSnapshot().bonusPoints !== null) values.push(game.getSnapshot().bonusPoints);
  }
  assert.equal(game.frame().bonus, null);
  assert.equal(game.getSnapshot().bonusPoints, null);
  for (let i = 1; i < values.length; i++) assert.ok(values[i] <= values[i - 1]);
  assert.equal(values[values.length - 1], 1);
});

test('eating the bonus adds its current value without growing', () => {
  let game;
  const random = () => 0;
  game = newGame(random);
  game.primary();
  while (game.frame().bonus === null) {
    game.turn(game.frame().heading === 'down' ? 'right' : 'down');
    game.tick();
  }
  const { bonus } = game.frame();
  const length = body(game).length;
  const before = game.getSnapshot().score;
  // Walk to the bonus: first match the row, then the column (edges wrap, so any heading works).
  const route = [];
  for (let guard = 0; game.frame().bonus !== null && guard < 80; guard++) {
    const head = body(game)[0];
    const heading = game.frame().heading;
    if (head.y !== bonus.y) game.turn(heading === 'up' ? 'up' : 'down');
    else game.turn(heading === 'left' ? 'left' : 'right');
    const value = game.getSnapshot().bonusPoints;
    game.tick();
    route.push(value);
    if (game.frame().bonus === null) break;
  }
  const gained = game.getSnapshot().score - before;
  assert.equal(game.getSnapshot().phase, 'playing');
  const last = route[route.length - 1];
  // Eaten before it expired: the score rose by the value shown just before the bite (plus at most one plain fruit).
  assert.ok(last !== null && last >= 1, 'bonus expired instead of being eaten');
  assert.ok(gained === last || gained === last + 1, 'gained ' + gained + ' last ' + last);
  assert.ok(body(game).length <= length + 1);
});

test('a new best score is persisted', () => {
  const saved = [];
  const storage = { readBest: () => 0, writeBest: (value) => saved.push(value) };
  const game = createGame({ random: () => 0, storage, timers });
  game.primary();
  game.turn('up');
  for (let i = 0; body(game)[0].y > 0 && i < 20; i++) game.tick();
  game.turn('left');
  for (let i = 0; body(game)[0].x > 0 && i < 40; i++) game.tick();
  assert.deepEqual(saved, [1]);
});
