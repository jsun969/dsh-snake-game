import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_CELL, MIN_CELL } from '../src/config.js';
import { clampPosition, fitCell } from '../src/game/geometry.js';

test('the window stays on screen', () => {
  const size = { width: 470, height: 215 };
  const viewport = { width: 1200, height: 800 };
  const at = (x, y) => ({ ...clampPosition({ x, y }, size, viewport) });
  assert.deepEqual(at(100, 100), { x: 100, y: 100 });
  assert.deepEqual(at(-50, -50), { x: 8, y: 8 });
  assert.deepEqual(at(5000, 5000), { x: 722, y: 577 });
  assert.deepEqual({ ...clampPosition({ x: 300, y: 300 }, size, { width: 300, height: 100 }) }, { x: 8, y: 8 });
});

test('the board cell fits the viewport within bounds', () => {
  assert.equal(fitCell({ width: 1600, height: 1000 }), MAX_CELL);
  assert.equal(fitCell({ width: 100, height: 100 }), MIN_CELL);
  assert.equal(fitCell({ width: 248, height: 2000 }), 10);
});
