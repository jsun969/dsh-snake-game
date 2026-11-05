import { BONUS_LIFE, COLS, ROWS } from '../config.js';

/** Paint one frame. Colors come from host theme tokens resolved on the canvas element. */
export function draw(canvas, cell, frame) {
  const context = canvas.getContext('2d');
  if (context === null) return;
  const ratio = window.devicePixelRatio || 1;
  const width = COLS * cell;
  const height = ROWS * cell;
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  }
  const styles = getComputedStyle(canvas);
  const token = (name) => styles.getPropertyValue(name).trim();
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  // The translucent board behind the canvas stays visible through cleared cells.
  context.clearRect(0, 0, width, height);

  if (frame.food !== null) drawFood(context, cell, frame.food, token('--dsw-alias-state-error-primary'));
  if (frame.bonus !== null) drawBonus(context, cell, frame.bonus, token('--dsw-alias-state-warn-primary'));

  const accent = frame.phase === 'over'
    ? token('--dsw-alias-state-idle-primary')
    : token('--dsw-alias-state-business-primary') || token('--dsw-alias-brand-primary');
  drawSnake(context, cell, frame.snake, accent);
}

function drawFood(context, cell, food, color) {
  context.fillStyle = color;
  context.beginPath();
  context.arc((food.x + 0.5) * cell, (food.y + 0.5) * cell, cell * 0.38, 0, Math.PI * 2);
  context.fill();
}

/** A five-point star that starts larger than a cell and shrinks toward a dot as its lifetime runs out. */
function drawBonus(context, cell, bonus, color) {
  const radius = cell * (0.2 + 0.55 * (bonus.life / BONUS_LIFE));
  const cx = (bonus.x + 0.5) * cell;
  const cy = (bonus.y + 0.5) * cell;
  context.fillStyle = color;
  context.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? radius : radius * 0.5;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
}

/** Body segments fade from the head to the tail. */
function drawSnake(context, cell, snake, color) {
  const inset = 1;
  context.fillStyle = color;
  snake.forEach((part, index) => {
    const along = snake.length > 1 ? index / (snake.length - 1) : 0;
    context.globalAlpha = 1 - along * 0.65;
    context.beginPath();
    context.roundRect(part.x * cell + inset, part.y * cell + inset, cell - inset * 2, cell - inset * 2, cell * 0.22);
    context.fill();
  });
  context.globalAlpha = 1;
}
