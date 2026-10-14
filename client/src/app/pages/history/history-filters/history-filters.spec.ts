import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HistoryFilters } from './history-filters';
import { HistoryFilterValues } from '@/app/models/history';

describe('HistoryFilters', () => {
  it('selects every supplier by default and emits dates as UTC midnight', async () => {
    TestBed.configureTestingModule({
      imports: [HistoryFilters],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNativeDateAdapter()],
    });
    const fixture = TestBed.createComponent(HistoryFilters);
    fixture.componentRef.setInput('routes', []);
    const emitted: HistoryFilterValues[] = [];
    fixture.componentInstance.filtersChange.subscribe((filters) => emitted.push(filters));

    TestBed.inject(HttpTestingController)
      .expectOne('/suppliers')
      .flush([
        { id: 1, name: 'Cheetah' },
        { id: 2, name: 'UPN' },
      ]);
    fixture.componentInstance.form.patchValue({
      startDate: new Date(2026, 9, 1, 15),
      endDate: new Date(2026, 9, 14),
    });
    await fixture.whenStable();

    expect(emitted.at(-1)).toEqual({
      startDate: Date.UTC(2026, 9, 1),
      endDate: Date.UTC(2026, 9, 14),
      supplierIds: [1, 2],
      routes: [],
    });
  });
});
