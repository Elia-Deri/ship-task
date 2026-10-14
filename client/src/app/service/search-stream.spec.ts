import { TestBed } from '@angular/core/testing';
import { HttpEventType, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SearchStream } from './search-stream';
import { SearchEvent, SearchRequest } from '@/app/models/search';

const request: SearchRequest = {
  source: 'Haifa',
  destination: 'Rotterdam',
  startDate: Date.UTC(2026, 9, 14),
  endDate: Date.UTC(2026, 9, 20),
  supplierIds: [1],
};

const startedFrame = 'data: {"type":"started","searchId":1,"supplierCount":1}\n\n';
const quoteFrame =
  'data: {"type":"quote","quote":{"supplierId":1,"supplierName":"Cheetah","price":100000}}\n\n';
const endedFrame = 'data: {"type":"ended","status":"completed"}\n\n';

describe('SearchStream', () => {
  let stream: SearchStream;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    stream = TestBed.inject(SearchStream);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('posts the request and emits each event as its frame arrives', () => {
    const events: SearchEvent[] = [];
    let isComplete = false;
    stream.open(request).subscribe({
      next: (event) => events.push(event),
      complete: () => (isComplete = true),
    });

    const searchRequest = httpTesting.expectOne('/searches');
    expect(searchRequest.request.method).toBe('POST');
    expect(searchRequest.request.body).toEqual(request);

    searchRequest.event({
      type: HttpEventType.DownloadProgress,
      loaded: 0,
      partialText: startedFrame,
    });
    expect(events.map((event) => event.type)).toEqual(['started']);

    searchRequest.event({
      type: HttpEventType.DownloadProgress,
      loaded: 0,
      partialText: startedFrame + quoteFrame,
    });
    expect(events.map((event) => event.type)).toEqual(['started', 'quote']);

    searchRequest.flush(startedFrame + quoteFrame + endedFrame);
    expect(events.map((event) => event.type)).toEqual(['started', 'quote', 'ended']);
    expect(isComplete).toBe(true);
  });

  it('aborts the request when the subscriber unsubscribes', () => {
    const subscription = stream.open(request).subscribe();
    const searchRequest = httpTesting.expectOne('/searches');

    subscription.unsubscribe();

    expect(searchRequest.cancelled).toBe(true);
  });

  it('errors when the server rejects the request', () => {
    let error: unknown;
    stream.open(request).subscribe({ error: (thrown: unknown) => (error = thrown) });

    httpTesting
      .expectOne('/searches')
      .flush('Unknown supplier ids', { status: 400, statusText: 'Bad Request' });

    expect(error).toBeDefined();
  });
});
