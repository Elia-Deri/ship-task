import { TestBed } from '@angular/core/testing';

import { Subject } from 'rxjs';

import { SearchService } from './search';
import { SearchStream } from './search-stream';
import { SearchEvent, SearchRequest } from '@/app/models/search';

const request: SearchRequest = {
  source: 'Haifa',
  destination: 'Rotterdam',
  startDate: Date.UTC(2026, 9, 14),
  endDate: Date.UTC(2026, 9, 20),
  supplierIds: [1, 2, 3],
};

function quote(supplierId: number, priceMinor: number): SearchEvent {
  return {
    type: 'quote',
    quote: { supplierId, supplierName: `Supplier ${supplierId}`, priceMinor },
  };
}

describe('SearchService', () => {
  let streams: Subject<SearchEvent>[];
  let service: SearchService;

  beforeEach(() => {
    streams = [];
    const open = () => {
      const stream = new Subject<SearchEvent>();
      streams.push(stream);
      return stream;
    };
    TestBed.configureTestingModule({ providers: [{ provide: SearchStream, useValue: { open } }] });
    service = TestBed.inject(SearchService);
  });

  it('keeps results sorted cheapest first as quotes arrive', () => {
    service.search(request);

    streams[0].next(quote(1, 30_000));
    streams[0].next(quote(2, 10_000));
    streams[0].next(quote(3, 20_000));

    expect(service.results().map((result) => result.supplierId)).toEqual([2, 3, 1]);
  });

  it('counts failures as responses and shrinks the pending count', () => {
    service.search(request);

    streams[0].next(quote(1, 10_000));
    streams[0].next({ type: 'failed', supplierId: 2, supplierName: 'Supplier 2' });

    expect(service.respondedCount()).toBe(2);
    expect(service.pendingCount()).toBe(1);
  });

  it('clears pending suppliers when the search times out', () => {
    service.search(request);

    streams[0].next({ type: 'ended', status: 'timedOut' });

    expect(service.status()).toBe('timedOut');
    expect(service.pendingCount()).toBe(0);
  });

  it('closes the old stream and ignores its late events when a new search starts', () => {
    service.search(request);
    service.search(request);

    streams[0].next(quote(1, 10_000));

    expect(streams[0].observed).toBe(false);
    expect(service.results()).toEqual([]);
  });

  it('marks the search as failed when the stream errors', () => {
    service.search(request);

    streams[0].error(new Error('Network down'));

    expect(service.status()).toBe('error');
    expect(service.pendingCount()).toBe(0);
  });
});
