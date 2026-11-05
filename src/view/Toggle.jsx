import React from 'react';
import { SnakeIcon } from './icons.jsx';
import css from './styles/toggle.css';

/** Reduce the Session status map to what the game reacts to. */
export function agentStatus(statuses, sessionId) {
  const current = statuses.get(sessionId);
  if (current?.pendingInteraction !== undefined) return 'pending';
  return current?.running === true ? 'running' : 'idle';
}

/**
 * Composer toolbar button. The overlay layer has no Session scope,
 * so this button also watches the Agent and pauses the game when it stops or needs the user.
 */
export function createToggle({ game, t, useLocale, useGame, setToggleElement }) {
  return function Toggle({ useSessionStatus, sessionId }) {
    useLocale();
    const state = useGame();
    const status = useSessionStatus((statuses) => agentStatus(statuses, sessionId));
    const previous = React.useRef({ sessionId, status });

    React.useEffect(() => {
      const last = previous.current;
      previous.current = { sessionId, status };
      if (last.sessionId !== sessionId || last.status === status) return;
      if (status === 'running') game.clearNotice();
      else game.notify(status === 'pending' ? 'pending' : 'done');
    }, [sessionId, status]);

    return (
      <>
        <style>{css}</style>
        <button
          ref={setToggleElement}
          type="button"
          className="dsh-snake-toggle"
          aria-pressed={state.open}
          aria-label={t('toggle')}
          title={t('toggle')}
          onClick={() => game.setOpen(!state.open)}
        >
          <SnakeIcon />
        </button>
      </>
    );
  };
}
