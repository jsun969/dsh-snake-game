import React from 'react';
import { DEFAULT_BOTTOM, DEFAULT_RIGHT, DRAG_THRESHOLD } from '../config.js';
import { clampPosition } from '../game/geometry.js';

const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });

/**
 * Position of a fixed, draggable element kept on screen.
 * A press that moves less than DRAG_THRESHOLD stays a click; `dragged()` tells click handlers which one it was.
 * @param rootRef - the positioned element.
 * @param storage - reads the saved position and saves it after a drag.
 * @param layoutKey - changes when the element's size changes, so it is re-clamped.
 */
export function useDrag(rootRef, storage, layoutKey) {
  const positionRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const draggedRef = React.useRef(false);
  const [position, setPosition] = React.useState(null);

  const place = (candidate) => {
    const root = rootRef.current;
    if (root === null) return;
    const size = { width: root.offsetWidth, height: root.offsetHeight };
    const view = viewport();
    const wanted = candidate ?? {
      x: view.width - size.width - DEFAULT_RIGHT,
      y: view.height - size.height - DEFAULT_BOTTOM,
    };
    positionRef.current = clampPosition(wanted, size, view);
    setPosition(positionRef.current);
  };

  React.useLayoutEffect(() => {
    place(positionRef.current ?? storage.readPosition());
  }, [layoutKey]);

  React.useEffect(() => {
    const onResize = () => place(positionRef.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handlers = {
    onPointerDown(event) {
      draggedRef.current = false;
      if (event.button !== 0 || positionRef.current === null || event.target.closest('button') !== null) return;
      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origin: positionRef.current,
      };
    },
    onPointerMove(event) {
      const drag = dragRef.current;
      if (drag === null || drag.pointerId !== event.pointerId) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (!draggedRef.current) {
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        draggedRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      place({ x: drag.origin.x + dx, y: drag.origin.y + dy });
    },
    onPointerUp: end,
    onPointerCancel: end,
  };

  function end(event) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (draggedRef.current && positionRef.current !== null) storage.writePosition(positionRef.current);
  }

  const style = position === null
    ? { left: 0, top: 0, visibility: 'hidden' }
    : { left: position.x, top: position.y };

  return { style, handlers, dragged: () => draggedRef.current };
}
