import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { History } from './history';

const emptyFilters = { startDate: null, endDate: null, supplierIds: [], routes: [] };

describe('History', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [History],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    // The child components are covered by their own specs; this one tests the page's data flow.
    TestBed.overrideComponent(History, { set: { imports: [], schemas: [CUSTOM_ELEMENTS_SCHEMA] } });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('cancels the in-flight request when the filters change', async () => {
    const fixture = TestBed.createComponent(History);
    await fixture.whenStable();
    httpTesting.expectOne('/history/routes').flush([]);
    const firstRequest = httpTesting.expectOne((request) => request.url === '/history');

    fixture.componentInstance.filters.set({ ...emptyFilters, supplierIds: [2] });
    await fixture.whenStable();

    expect(firstRequest.cancelled).toBe(true);
    httpTesting.expectOne((request) => request.url === '/history').flush([]);
  });

  it('shows an error when the history fails to load', async () => {
    const fixture = TestBed.createComponent(History);
    await fixture.whenStable();
    httpTesting.expectOne('/history/routes').flush([]);

    httpTesting
      .expectOne((request) => request.url === '/history')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();

    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')).not.toBeNull();
  });
});
