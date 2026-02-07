import { describe, it, expect } from 'vitest';
import { calculateScore, isValidTransition, getNextStatus } from '../../src/utils/scoring';

describe('calculateScore', () => {
  it('returns 0 for incorrect answers', () => {
    expect(calculateScore(false, 5000, 20000)).toBe(0);
  });

  it('returns 0 for incorrect answers regardless of speed', () => {
    expect(calculateScore(false, 0, 20000)).toBe(0);
    expect(calculateScore(false, 20000, 20000)).toBe(0);
  });

  it('returns full points for instant correct answer', () => {
    const score = calculateScore(true, 0, 20000, 1000);
    expect(score).toBe(1000); // 500 base + 500 speed bonus
  });

  it('returns base points (no speed bonus) for last-second answer', () => {
    const score = calculateScore(true, 20000, 20000, 1000);
    expect(score).toBe(500); // 500 base + 0 speed bonus
  });

  it('returns proportional score for mid-speed answer', () => {
    const score = calculateScore(true, 10000, 20000, 1000);
    expect(score).toBe(750); // 500 base + 250 speed bonus
  });

  it('handles custom base points', () => {
    const score = calculateScore(true, 0, 20000, 2000);
    expect(score).toBe(2000);
  });

  it('clamps negative response times', () => {
    const score = calculateScore(true, -1000, 20000, 1000);
    expect(score).toBe(1000); // Should still be max
  });

  it('handles zero time limit', () => {
    const score = calculateScore(true, 0, 0, 1000);
    expect(score).toBe(1000);
  });

  it('handles response time exceeding limit', () => {
    const score = calculateScore(true, 25000, 20000, 1000);
    expect(score).toBe(500); // Base only, speed bonus clamped to 0
  });
});

describe('isValidTransition', () => {
  it('allows lobby -> question', () => {
    expect(isValidTransition('lobby', 'question')).toBe(true);
  });

  it('allows lobby -> finished', () => {
    expect(isValidTransition('lobby', 'finished')).toBe(true);
  });

  it('disallows lobby -> feedback', () => {
    expect(isValidTransition('lobby', 'feedback')).toBe(false);
  });

  it('disallows lobby -> leaderboard', () => {
    expect(isValidTransition('lobby', 'leaderboard')).toBe(false);
  });

  it('allows question -> feedback', () => {
    expect(isValidTransition('question', 'feedback')).toBe(true);
  });

  it('allows question -> leaderboard', () => {
    expect(isValidTransition('question', 'leaderboard')).toBe(true);
  });

  it('allows question -> finished', () => {
    expect(isValidTransition('question', 'finished')).toBe(true);
  });

  it('allows feedback -> leaderboard', () => {
    expect(isValidTransition('feedback', 'leaderboard')).toBe(true);
  });

  it('allows feedback -> question (next question)', () => {
    expect(isValidTransition('feedback', 'question')).toBe(true);
  });

  it('allows leaderboard -> question', () => {
    expect(isValidTransition('leaderboard', 'question')).toBe(true);
  });

  it('allows leaderboard -> finished', () => {
    expect(isValidTransition('leaderboard', 'finished')).toBe(true);
  });

  it('disallows finished -> anything', () => {
    expect(isValidTransition('finished', 'lobby')).toBe(false);
    expect(isValidTransition('finished', 'question')).toBe(false);
    expect(isValidTransition('finished', 'feedback')).toBe(false);
    expect(isValidTransition('finished', 'leaderboard')).toBe(false);
  });
});

describe('getNextStatus', () => {
  it('lobby -> question', () => {
    expect(getNextStatus('lobby', true)).toBe('question');
  });

  it('question -> feedback', () => {
    expect(getNextStatus('question', true)).toBe('feedback');
  });

  it('feedback -> leaderboard', () => {
    expect(getNextStatus('feedback', true)).toBe('leaderboard');
  });

  it('leaderboard -> question when more questions', () => {
    expect(getNextStatus('leaderboard', true)).toBe('question');
  });

  it('leaderboard -> finished when no more questions', () => {
    expect(getNextStatus('leaderboard', false)).toBe('finished');
  });

  it('finished stays finished', () => {
    expect(getNextStatus('finished', true)).toBe('finished');
  });
});
