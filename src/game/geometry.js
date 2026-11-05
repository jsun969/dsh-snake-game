import { CHROME_HEIGHT, COLS, EDGE_MARGIN, MAX_CELL, MIN_CELL, ROWS, VIEWPORT_MARGIN } from '../config.js';

/** Keep the whole window on screen; when it cannot fit, keep its top-left corner reachable. */
export function clampPosition(position, size, viewport) {
  const limit = (value, extent, available) =>
    Math.max(EDGE_MARGIN, Math.min(value, available - extent - EDGE_MARGIN));
  return {
    x: limit(position.x, size.width, viewport.width),
    y: limit(position.y, size.height, viewport.height),
  };
}

/** Largest whole-pixel cell that lets the square board and its chrome fit the viewport. */
export function fitCell(viewport) {
  const fit = Math.min((viewport.width - VIEWPORT_MARGIN) / COLS, (viewport.height - CHROME_HEIGHT) / ROWS);
  return Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(fit)));
}
