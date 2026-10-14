import { isRecord, toUtcMidnight } from '.';

describe('toUtcMidnight', () => {
  it('keeps the picked calendar day regardless of the local time', () => {
    expect(toUtcMidnight(new Date(2026, 9, 14, 23, 30))).toBe(Date.UTC(2026, 9, 14));
  });
});

describe('isRecord', () => {
  it('accepts objects and rejects null and primitives', () => {
    expect(isRecord({ id: 1 })).toBe(true);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('text')).toBe(false);
  });
});
