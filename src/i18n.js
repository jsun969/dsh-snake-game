export const NS = 'local-snake';

export const EN = {
  toggle: 'Snake',
  close: 'Close',
  score: 'Score',
  best: 'Best',
  bonus: 'Bonus',
  board: 'Snake board. Arrow keys or WASD to move, Space to pause.',
  ready: 'Press an arrow key to start',
  paused: 'Press Space to continue',
  over: 'Game over',
  restart: 'Press Space to play again',
  done: 'Agent finished',
  pending: 'Agent needs you',
};

export const ZH = {
  toggle: '贪吃蛇',
  close: '关闭',
  score: '分数',
  best: '最高',
  bonus: '奖励',
  board: '贪吃蛇棋盘。方向键或 WASD 移动，空格暂停。',
  ready: '按方向键开始',
  paused: '按空格继续',
  over: '游戏结束',
  restart: '按空格再来一局',
  done: 'Agent 已完成',
  pending: 'Agent 需要你处理',
};

/**
 * Register dictionaries with the Client locale service: English, plus Chinese for every zh* locale.
 * @returns disposer for every registration.
 */
export function registerDictionaries(locale) {
  const disposers = [locale.register(NS, 'en', EN)];
  for (const { id } of locale.getLocale().locales) {
    if (id.toLowerCase().startsWith('zh')) disposers.push(locale.register(NS, id, ZH));
  }
  return () => {
    for (const dispose of disposers) dispose();
  };
}
