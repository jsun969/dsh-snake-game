import React from 'react';
import { KEY_DIRECTIONS } from '../game/directions.js';
import { fitCell } from '../game/geometry.js';
import { draw } from './draw.js';
import { CloseIcon } from './icons.jsx';
import { useDrag } from './useDrag.js';
import css from './styles/card.css';

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

/** The floating game window. */
export function createCard({ game, storage, t, useLocale, useGame, focusToggle }) {
  return function Card() {
    useLocale();
    const state = useGame();
    const rootRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const [cell, setCell] = React.useState(() => fitCell(viewport()));
    const drag = useDrag(rootRef, storage, cell);

    React.useEffect(() => {
      rootRef.current?.focus({ preventScroll: true });
      return () => game.pause();
    }, []);

    React.useEffect(() => {
      const onResize = () => setCell(fitCell(viewport()));
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

    React.useLayoutEffect(() => {
      const render = () => {
        if (canvasRef.current !== null) draw(canvasRef.current, cell, game.frame());
      };
      render();
      return game.onFrame(render);
    }, [cell]);

    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.target !== event.currentTarget) return;
      const key = event.key.toLowerCase();
      const direction = KEY_DIRECTIONS[key];
      if (direction !== undefined) game.turn(direction);
      else if (key === ' ' || key === 'enter') game.primary();
      else if (key === 'escape') {
        game.setOpen(false);
        focusToggle();
      } else return;
      event.preventDefault();
      event.stopPropagation();
    };

    const onBoardClick = () => {
      if (drag.dragged()) return;
      rootRef.current?.focus({ preventScroll: true });
      game.activate();
    };

    const hint = { ready: t('ready'), paused: t('paused'), over: t('restart') }[state.phase];
    const heading = state.notice !== null ? t(state.notice) : state.phase === 'over' ? t('over') : null;

    return (
      <div
        ref={rootRef}
        className="dsh-snake-card"
        style={drag.style}
        tabIndex={0}
        role="application"
        aria-label={t('board')}
        onKeyDown={onKeyDown}
        onBlur={(event) => {
          if (event.target === event.currentTarget) game.pause();
        }}
        {...drag.handlers}
      >
        <style>{css}</style>
        <div className="dsh-snake-header">
          <span>{t('score')}<b>{state.score}</b></span>
          <span>{t('best')}<b>{state.best}</b></span>
          {state.bonusPoints === null ? null : (
            <span className="dsh-snake-bonus">{t('bonus')}<b>+{state.bonusPoints}</b></span>
          )}
          <button
            type="button"
            className="dsh-snake-close"
            aria-label={t('close')}
            title={t('close')}
            tabIndex={-1}
            onClick={() => game.setOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>
        <div className="dsh-snake-board" onClick={onBoardClick}>
          <canvas ref={canvasRef} />
          {state.phase === 'playing' ? null : (
            <div className="dsh-snake-overlay" aria-live="polite">
              {heading === null ? null : <strong>{heading}</strong>}
              {hint}
            </div>
          )}
        </div>
      </div>
    );
  };
}
