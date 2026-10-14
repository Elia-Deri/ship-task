import { toUtcMidnight } from './utils';

describe('toUtcMidnight', () => {
  it('keeps the picked calendar day regardless of the local time', () => {
    expect(toUtcMidnight(new Date(2026, 9, 14, 23, 30))).toBe(Date.UTC(2026, 9, 14));
  });
});
