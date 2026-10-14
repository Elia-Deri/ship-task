import { TestBed } from '@angular/core/testing';

import { Subject } from 'rxjs';

import { Results } from './results';
import { SearchService } from '@/app/service/search';
import { SearchEvent } from '@/app/models/search';
import { SearchStream } from '@/app/service/search-stream';

describe('Results', () => {
  let events: Subject<SearchEvent>;

  beforeEach(() => {
    events = new Subject<SearchEvent>();
    TestBed.configureTestingModule({
      imports: [Results],
      providers: [{ provide: SearchStream, useValue: { open: () => events } }],
    });
  });

  it('shows a failed card and the failure count in the progress message', async () => {
    const fixture = TestBed.createComponent(Results);
    TestBed.inject(SearchService).search({
      source: 'Haifa',
      destination: 'Rotterdam',
      startDate: Date.UTC(2026, 9, 14),
      endDate: Date.UTC(2026, 9, 20),
      supplierIds: [1, 2],
    });

    events.next({
      type: 'quote',
      quote: { supplierId: 1, supplierName: 'Cheetah', price: 100_000 },
    });
    events.next({ type: 'failed', supplierId: 2, supplierName: 'Israel Post' });
    events.next({ type: 'ended', status: 'completed' });
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    const progress = element.querySelector('[aria-live]')?.textContent?.replace(/\s+/g, ' ').trim();
    expect(progress).toBe('2 of 2 suppliers responded. 1 Failed · Completed');
    expect(element.querySelector('.card-failed')?.textContent).toContain('Israel Post');
    expect(element.querySelectorAll('.animate-pulse')).toHaveLength(0);
  });
});
