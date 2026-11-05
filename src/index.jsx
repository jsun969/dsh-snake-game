/** Client plugin entry: wires the game, locale and views into DSH slots. */
import React from 'react';
import { createGame } from './game/engine.js';
import { NS, registerDictionaries } from './i18n.js';
import { createStorage } from './storage.js';
import { createCard } from './view/Card.jsx';
import { createToggle } from './view/Toggle.jsx';

export const inject = ['slots', 'locale'];

export function apply(ctx) {
  const storage = createStorage(window.localStorage);
  const game = createGame({ storage });
  ctx.effect(() => () => game.dispose(), 'dsh-snake: game');
  ctx.effect(() => registerDictionaries(ctx.locale), 'dsh-snake: locale');
  ctx.on('theme/change', () => {
    requestAnimationFrame(() => game.redraw());
  });

  const t = ctx.locale.bind(NS);
  const subscribeLocale = (listener) => ctx.locale.subscribe(listener);
  const localeSnapshot = () => ctx.locale.getSnapshot();
  let toggleElement = null;

  const runtime = {
    game,
    storage,
    t,
    useLocale: () => React.useSyncExternalStore(subscribeLocale, localeSnapshot),
    useGame: () => React.useSyncExternalStore(game.subscribe, game.getSnapshot),
    setToggleElement: (element) => {
      toggleElement = element;
    },
    focusToggle: () => toggleElement?.focus({ preventScroll: true }),
  };

  const Card = createCard(runtime);
  function FloatingWindow() {
    return runtime.useGame().open ? <Card /> : null;
  }
  const Toggle = createToggle(runtime);

  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay', id: 'dsh-snake', label: () => t('toggle'),
  }, FloatingWindow));
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left', id: 'dsh-snake-toggle', order: 50, label: () => t('toggle'),
  }, Toggle));
}
