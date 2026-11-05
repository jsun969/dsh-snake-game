// Loads the built dsh-snake/client.js the way DSH does and checks its registrations. `just test` builds it first; `pnpm test` alone does not.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('../dsh-snake/client.js', import.meta.url), 'utf8');
const { name } = JSON.parse(await readFile(new URL('../dsh-snake/package.json', import.meta.url), 'utf8'));

function load() {
  const loaded = [];
  const requested = [];
  const React = { createElement() {}, Fragment: Symbol('Fragment') };
  const window = {
    __ModuleLoader__: {
      load(entry) {
        loaded.push({ id: entry.id, exports: entry.factory((id) => (requested.push(id), React)) });
      },
    },
    localStorage: { getItem: () => null, setItem() {} },
  };
  vm.runInNewContext(source, { window });
  return { loaded, requested };
}

test('registers one module under the package name and only requires react', () => {
  const { loaded, requested } = load();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, name);
  assert.deepEqual([...new Set(requested)], ['react']);
  assert.deepEqual([...loaded[0].exports.inject], ['slots', 'locale']);
  assert.equal(typeof loaded[0].exports.apply, 'function');
});

test('apply registers the overlay window and the toolbar button, and cleans up', () => {
  const { loaded } = load();
  const registrations = [];
  const effects = [];
  const ctx = {
    effect: (callback) => effects.push(callback()),
    on() {},
    locale: {
      register: () => () => {},
      getLocale: () => ({ locales: [{ id: 'en' }, { id: 'zh-CN' }] }),
      bind: () => (key) => key,
      subscribe: () => () => {},
      getSnapshot: () => ({}),
    },
    slots: {
      inject: (key, callback) => callback(),
      register: (options, component) => registrations.push({ ...options, component }),
    },
  };
  loaded[0].exports.apply(ctx);
  assert.deepEqual(registrations.map(({ name, id }) => `${name}#${id}`), [
    'shell.overlay#dsh-snake',
    'conversation.input.left#dsh-snake-toggle',
  ]);
  assert.ok(registrations.every(({ component }) => typeof component === 'function'));
  assert.ok(effects.every((dispose) => typeof dispose === 'function'));
  for (const dispose of effects) dispose();
});
