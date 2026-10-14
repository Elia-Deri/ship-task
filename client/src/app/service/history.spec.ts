import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { firstValueFrom } from 'rxjs';

import { HistoryService } from './history';

const row = {
  id: 1,
  searchId: 4,
  respondedAt: Date.UTC(2026, 9, 14, 9, 30),
  source: 'Haifa',
  destination: 'Rotterdam',
  supplierName: 'Cheetah',
  price: null,
  responseTimeMs: 1200,
};

describe('HistoryService', () => {
  let service: HistoryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HistoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the filters as query params the server can bind', async () => {
    const result = firstValueFrom(
      service.getRows({
        startDate: Date.UTC(2026, 9, 1),
        endDate: null,
        supplierIds: [1, 2],
        routes: [{ source: 'Haifa', destination: 'Rotterdam' }],
      }),
    );

    const request = httpTesting.expectOne((candidate) => candidate.url === '/history');
    const { params } = request.request;
    expect(params.get('startDate')).toBe(String(Date.UTC(2026, 9, 1)));
    expect(params.has('endDate')).toBe(false);
    expect(params.getAll('supplierIds')).toEqual(['1', '2']);
    expect(params.get('routes[0].source')).toBe('Haifa');
    expect(params.get('routes[0].destination')).toBe('Rotterdam');
    request.flush([row]);

    await expect(result).resolves.toEqual([row]);
  });

  it('rejects a malformed history response', async () => {
    const result = firstValueFrom(
      service.getRows({ startDate: null, endDate: null, supplierIds: [], routes: [] }),
    );

    httpTesting.expectOne('/history').flush([{ ...row, price: '12' }]);

    await expect(result).rejects.toThrow('Invalid history response.');
  });

  it('loads the route options', async () => {
    const routes = [{ source: 'Haifa', destination: 'Rotterdam' }];
    const result = firstValueFrom(service.getRoutes());

    httpTesting.expectOne('/history/routes').flush(routes);

    await expect(result).resolves.toEqual(routes);
  });
});
