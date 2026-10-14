import { parseSearchEvent } from './search';

describe('parseSearchEvent', () => {
  it('parses a quote event', () => {
    const event = parseSearchEvent({
      type: 'quote',
      quote: { supplierId: 1, supplierName: 'Cheetah', price: 105_500 },
    });

    expect(event).toEqual({
      type: 'quote',
      quote: { supplierId: 1, supplierName: 'Cheetah', price: 105_500 },
    });
  });

  it('accepts the other event types', () => {
    expect(parseSearchEvent({ type: 'started', searchId: 3, supplierCount: 7 })).toEqual({
      type: 'started',
      searchId: 3,
      supplierCount: 7,
    });
    expect(parseSearchEvent({ type: 'failed', supplierId: 2, supplierName: 'UPN' })).toEqual({
      type: 'failed',
      supplierId: 2,
      supplierName: 'UPN',
    });
    expect(parseSearchEvent({ type: 'ended', status: 'timedOut' })).toEqual({
      type: 'ended',
      status: 'timedOut',
    });
  });

  it('rejects unknown or malformed events', () => {
    expect(() => parseSearchEvent({ type: 'quote', quote: { supplierId: '1' } })).toThrow();
    expect(() => parseSearchEvent({ type: 'ended', status: 'cancelled' })).toThrow();
    expect(() => parseSearchEvent(null)).toThrow();
  });
});
