import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStorage } from '../src/storage.js';

const memory = () => {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
};

test('best score and position round-trip', () => {
  const storage = createStorage(memory());
  assert.equal(storage.readBest(), 0);
  assert.equal(storage.readPosition(), null);
  storage.writeBest(12);
  storage.writePosition({ x: 40, y: 50 });
  assert.equal(storage.readBest(), 12);
  assert.deepEqual(storage.readPosition(), { x: 40, y: 50 });
});

test('malformed values read as defaults', () => {
  const store = memory();
  store.setItem('dsh-snake.best', 'abc');
  store.setItem('dsh-snake.position', '{"x":"1"}');
  const storage = createStorage(store);
  assert.equal(storage.readBest(), 0);
  assert.equal(storage.readPosition(), null);
});

test('unavailable storage never throws', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('full'); } };
  for (const store of [broken, undefined]) {
    const storage = createStorage(store);
    storage.writeBest(3);
    storage.writePosition({ x: 1, y: 2 });
    assert.equal(storage.readBest(), 0);
    assert.equal(storage.readPosition(), null);
  }
});
