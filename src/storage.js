import { BEST_KEY, POSITION_KEY } from './config.js';

/**
 * Best score and window position in browser storage. Storage can be unavailable or full;
 * values then last for this page only.
 * @param {Storage | undefined} store
 */
export function createStorage(store) {
  const read = (key) => {
    try {
      return store?.getItem(key) ?? null;
    } catch {
      return null;
    }
  };
  const write = (key, value) => {
    try {
      store?.setItem(key, value);
    } catch {
      // Ignored: see above.
    }
  };

  return {
    readBest() {
      const value = Number(read(BEST_KEY));
      return Number.isFinite(value) && value > 0 ? value : 0;
    },
    writeBest(value) {
      write(BEST_KEY, String(value));
    },
    readPosition() {
      try {
        const value = JSON.parse(read(POSITION_KEY));
        return Number.isFinite(value?.x) && Number.isFinite(value?.y) ? { x: value.x, y: value.y } : null;
      } catch {
        return null;
      }
    },
    writePosition(position) {
      write(POSITION_KEY, JSON.stringify(position));
    },
  };
}
