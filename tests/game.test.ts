import { describe, expect, it } from 'vitest';
import {
  BRUTAL_WORDS, CHALLENGES, consumePower, createGame, drawUnique, fastTrack,
  IQ_QUESTIONS, marriageIqPercent, parseGame, POWER_CARDS, RAP_WORDS,
  remainingSeconds, rerollRapWords, resolveCurrent, restorePower, scoreIqAnswer, selectPromotion,
  serializeGame, voteResult,
} from '../src/game';

describe('game setup and progression', () => {
  it('starts at rank 2 with all four power cards available', () => {
    const game = createGame();
    expect(game.rank).toBe(2);
    expect(game.powerUsed).toEqual([]);
    expect(POWER_CARDS).toHaveLength(4);
  });

  it('consumes each power card once and allows restoration', () => {
    const first = consumePower(createGame(), 'castling');
    expect(first.powerUsed).toEqual(['castling']);
    expect(consumePower(first, 'castling')).toBe(first);
    expect(restorePower(first, 'castling').powerUsed).toEqual([]);
  });

  it('advances one rank for a resolution and rejects duplicate progression', () => {
    const first = resolveCurrent(createGame(), 'completed');
    expect(first.rank).toBe(3);
    expect(first.step).toBe(1);
    expect(resolveCurrent(first, 'completed', 0)).toBe(first);
    expect(resolveCurrent(first, 'completed').rank).toBe(4);
    expect(CHALLENGES).toHaveLength(6);
  });

  it('persists and restores a valid game state', () => {
    const game = { ...resolveCurrent(createGame(), 'modified'), groom: 'Test Groom', selectedPiece: '', screen: 'game' as const };
    expect(parseGame(serializeGame(game))).toMatchObject({ rank: 3, groom: 'Test Groom', statuses: ['modified', null, null, null, null, null] });
    expect(() => parseGame('{"version":99}')).toThrow();
  });

  it('rejects promotion before rank 8 and permits only one piece selection', () => {
    const early = selectPromotion(createGame(), 'Queen');
    expect(early.selectedPiece).toBe('');
    const atEighth = { ...createGame(), rank: 8, step: 6, screen: 'promotion' as const };
    expect(selectPromotion(atEighth, 'Knight').selectedPiece).toBe('Knight');
    expect(selectPromotion(selectPromotion(atEighth, 'Knight'), 'Rook').selectedPiece).toBe('Knight');
  });

  it('reaches rank 8 after six resolutions and keeps skipped status distinct', () => {
    let game = createGame();
    for (let i = 0; i < 5; i += 1) game = resolveCurrent(game, 'completed');
    game = resolveCurrent(game, 'skipped');
    expect(game.rank).toBe(8);
    expect(game.screen).toBe('promotion');
    expect(game.statuses[5]).toBe('skipped');
  });
});

describe('challenge tools', () => {
  it('draws five distinct Marriage IQ scenarios', () => {
    const indices = drawUnique(IQ_QUESTIONS.map((_, index) => index), 5, () => 0.37);
    expect(indices).toHaveLength(5);
    expect(new Set(indices).size).toBe(5);
  });

  it('maps the Marriage IQ score range transparently to zero and one hundred', () => {
    expect(marriageIqPercent(Array(5).fill(-2))).toBe(0);
    expect(marriageIqPercent(Array(5).fill(3))).toBe(100);
    expect(marriageIqPercent([3, 2, 1, 0, -1])).toBe(60);
  });

  it('accepts one IQ evaluation per scenario even on rapid repeated taps', () => {
    const first = scoreIqAnswer(createGame(), 2, 0);
    expect(scoreIqAnswer(first, 3, 0)).toBe(first);
    expect(first.iqScores).toEqual([2]);
  });

  it('draws six unique rap terms and preserves locked terms and their slots on reroll', () => {
    const first = drawUnique(RAP_WORDS.Easy, 6, () => 0.43).map((word) => ({ word, locked: false }));
    expect(new Set(first.map((item) => item.word)).size).toBe(6);
    const locked = first.map((item, index) => ({ ...item, locked: index === 2 || index === 5 }));
    const rerolled = rerollRapWords(locked, BRUTAL_WORDS, () => 0.2);
    expect(rerolled[2]).toEqual(locked[2]);
    expect(rerolled[5]).toEqual(locked[5]);
    expect(new Set(rerolled.map((item) => item.word)).size).toBe(6);
  });

  it('counts a strict majority, tie, loss and pending votes correctly', () => {
    expect(voteResult(['in', 'in', 'out'])).toBe('deal');
    expect(voteResult(['in', 'out'])).toBe('tie');
    expect(voteResult(['out', 'out', 'in'])).toBe('no-deal');
    expect(voteResult(['in', null])).toBe('pending');
  });

  it('defers the Queen’s verdict without double-advancing the pawn', () => {
    let game = createGame();
    for (let i = 0; i < 4; i += 1) game = resolveCurrent(game, 'completed');
    game = resolveCurrent(game, 'deferred');
    expect(game.statuses[4]).toBe('deferred');
    expect(game.rank).toBe(7);
    expect({ ...game, queenVerdict: '!! Brilliant Move' }.rank).toBe(7);
  });

  it('fast-tracks unresolved challenges as deferred', () => {
    let game = createGame();
    game = resolveCurrent(game, 'completed');
    game = fastTrack(game);
    expect(game.rank).toBe(8);
    expect(game.screen).toBe('promotion');
    expect(game.statuses).toEqual(['completed', 'deferred', 'deferred', 'deferred', 'deferred', 'deferred']);
  });

  it('lets the Arbiter complete a deferred envelope after promotion without advancing twice', () => {
    let game = createGame();
    for (let i = 0; i < 4; i += 1) game = resolveCurrent(game, 'completed');
    game = resolveCurrent(game, 'deferred');
    game = resolveCurrent(game, 'completed');
    game = { ...game, selectedPiece: 'Queen', screen: 'reward' };
    game = { ...game, step: 4, rank: 6, screen: 'game' };
    const replayed = resolveCurrent(game, 'completed', 4);
    expect(replayed.statuses[4]).toBe('completed');
    expect(replayed.step).toBe(6);
    expect(replayed.rank).toBe(8);
    expect(replayed.screen).toBe('reward');
  });

  it('uses timestamps for timers after interruption', () => {
    expect(remainingSeconds({ label: 'test', duration: 60, remaining: 60, startedAt: 1_000 }, 11_000)).toBe(50);
    expect(remainingSeconds({ label: 'test', duration: 60, remaining: 30, startedAt: null }, 11_000)).toBe(30);
  });
});
