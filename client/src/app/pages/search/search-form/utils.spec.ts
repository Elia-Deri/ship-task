import { FormControl } from '@angular/forms';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';

import { knownLocationValidator, toUtcMidnight } from './utils';

const LOCATIONS = ['Port of Haifa, Israel', 'Haifa Bay, Israel'];

describe('toUtcMidnight', () => {
  it('keeps the picked calendar day regardless of the local time', () => {
    expect(toUtcMidnight(new Date(2026, 9, 14, 23, 30))).toBe(Date.UTC(2026, 9, 14));
  });
});

describe('knownLocationValidator', () => {
  let search: ReturnType<typeof vi.fn<(query: string) => Observable<string[]>>>;

  beforeEach(() => {
    vi.useFakeTimers();
    search = vi.fn((query: string) => of(LOCATIONS.filter((location) => location.includes(query))));
  });

  afterEach(() => vi.useRealTimers());

  async function validate(value: unknown) {
    const result = firstValueFrom(knownLocationValidator(search)(new FormControl(value)));
    await vi.advanceTimersByTimeAsync(250);
    return result;
  }

  it('accepts a location the server returns verbatim', async () => {
    await expect(validate('Port of Haifa, Israel')).resolves.toBeNull();
    expect(search).toHaveBeenCalledWith('Port of Haifa, Israel');
  });

  it('rejects partial text that only matches suggestions', async () => {
    await expect(validate('Haifa')).resolves.toEqual({ unknownLocation: true });
  });

  it('rejects a location with different casing', async () => {
    await expect(validate('port of haifa, israel')).resolves.toEqual({ unknownLocation: true });
  });

  it('rejects a non-string value without calling the server', async () => {
    await expect(validate(null)).resolves.toEqual({ unknownLocation: true });
    expect(search).not.toHaveBeenCalled();
  });

  it('rejects the location when the server request fails', async () => {
    search.mockReturnValue(throwError(() => new Error('offline')));

    await expect(validate('Port of Haifa, Israel')).resolves.toEqual({ unknownLocation: true });
  });

  it('waits for typing to pause before asking the server', async () => {
    const result = firstValueFrom(
      knownLocationValidator(search)(new FormControl('Port of Haifa, Israel')),
    );

    await vi.advanceTimersByTimeAsync(249);
    expect(search).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    await expect(result).resolves.toBeNull();
  });
});
