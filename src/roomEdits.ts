import type { GameState } from './game';

export type Change = { key: keyof GameState; before: unknown; after: unknown };
export type Move = {
  changes: Change[];
  position: [GameState['screen'], number, number | null, boolean];
};

function position(state: GameState): Move['position'] {
  return [state.screen, state.rank, state.viewingStep, state.opened];
}

export function makeMove(before: GameState, after: GameState): Move {
  const keys = Object.keys(before) as Array<keyof GameState>;
  const changes = keys.filter(key => before[key] !== after[key])
    .map(key => ({ key, before: before[key], after: after[key] }));
  return { changes, position: position(before) };
}

const conflict = Symbol('outdated move');
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function mergeValue(current: unknown, before: unknown, after: unknown): unknown {
  if (same(current, before)) return after;
  if (same(before, after) || same(current, after)) return current;
  // Different guests can vote or score different rows at the same time.
  if (Array.isArray(current) && Array.isArray(before) && Array.isArray(after)
    && current.length === before.length && before.length === after.length) {
    const merged = current.map((value, i) => mergeValue(value, before[i], after[i]));
    if (!merged.includes(conflict)) return merged;
  }
  return conflict;
}

export function applyMove(state: GameState, move: Move): GameState | null {
  if (!same(position(state), move.position) || !Array.isArray(move.changes)) return null;
  const next = { ...state };
  for (const { key, before, after } of move.changes) {
    if (!Object.prototype.hasOwnProperty.call(state, key) || ['version','groom','bride','friends'].includes(key)) return null;
    const value = mergeValue(state[key], before, after);
    if (value === conflict) return null;
    Object.assign(next, { [key]: value });
  }
  return next;
}
