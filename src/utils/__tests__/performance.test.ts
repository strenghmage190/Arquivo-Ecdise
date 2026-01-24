import { getOptimizedInterval } from '../performance';

describe('performance utilities', () => {
  test('getOptimizedInterval increases when factor > 1', () => {
    expect(getOptimizedInterval(100, 2)).toBe(200);
    expect(getOptimizedInterval(50, 3)).toBe(150);
  });
});
