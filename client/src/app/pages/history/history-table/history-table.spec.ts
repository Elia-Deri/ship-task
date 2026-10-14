import { comparePricesFailedLast } from './history-table';

// Mirrors AG Grid: ascending uses the comparator as is, descending negates it.
function sortPrices(prices: (number | null)[], isDescending: boolean) {
  const direction = isDescending ? -1 : 1;
  return [...prices].sort((a, b) => direction * comparePricesFailedLast(a, b, isDescending));
}

describe('comparePricesFailedLast', () => {
  const prices = [null, 120, 80, null, 200];

  it('puts failed prices last when sorting cheapest first', () => {
    expect(sortPrices(prices, false)).toEqual([80, 120, 200, null, null]);
  });

  it('puts failed prices last when sorting most expensive first', () => {
    expect(sortPrices(prices, true)).toEqual([200, 120, 80, null, null]);
  });
});
