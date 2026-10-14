import { catchError, EMPTY, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApplicationRef, computed, DOCUMENT, inject, Service, signal } from '@angular/core';

import { SearchStream } from './search-stream';
import {
  SearchEvent,
  SearchRequest,
  SearchStatus,
  SupplierFailure,
  SupplierQuote,
} from '@/app/models/search';

@Service()
export class SearchService {
  private readonly document = inject(DOCUMENT);
  private readonly stream = inject(SearchStream);
  private readonly appRef = inject(ApplicationRef);
  private readonly requests = new Subject<SearchRequest>();
  private readonly quotes = signal<SupplierQuote[]>([]);
  private readonly failedSuppliers = signal<SupplierFailure[]>([]);

  readonly request = signal<SearchRequest | null>(null);
  readonly status = signal<SearchStatus | null>(null);
  readonly failures = this.failedSuppliers.asReadonly();

  readonly results = computed(() =>
    [...this.quotes()].sort((a, b) => a.price - b.price || a.supplierId - b.supplierId),
  );
  readonly requestedCount = computed(() => this.request()?.supplierIds.length ?? 0);
  readonly failedCount = computed(() => this.failedSuppliers().length);
  readonly respondedCount = computed(() => this.quotes().length + this.failedCount());
  readonly pendingCount = computed(() =>
    this.status() === 'running' ? this.requestedCount() - this.respondedCount() : 0,
  );

  constructor() {
    this.requests
      .pipe(
        switchMap((request) =>
          this.stream.open(request).pipe(
            catchError(() => {
              this.status.set('error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.applyEvent(event));
  }

  search(request: SearchRequest): void {
    this.request.set(request);
    this.quotes.set([]);
    this.failedSuppliers.set([]);
    this.status.set('running');
    this.requests.next(request);
  }

  private applyEvent(event: SearchEvent): void {
    switch (event.type) {
      case 'started':
        return;
      case 'quote':
        this.animate(() => this.quotes.update((quotes) => [...quotes, event.quote]));
        return;
      case 'failed':
        this.animate(() =>
          this.failedSuppliers.update((failures) => [
            ...failures,
            { supplierId: event.supplierId, supplierName: event.supplierName },
          ]),
        );
        return;
      case 'ended':
        this.animate(() => this.status.set(event.status));
    }
  }

  private animate(update: () => void): void {
    const isMotionReduced =
      typeof this.document.startViewTransition !== 'function' ||
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isMotionReduced) {
      update();
      return;
    }

    // Zoneless change detection is async; flush it inside the callback so the transition captures the new layout.
    this.document.startViewTransition(() => {
      update();
      this.appRef.tick();
    });
  }
}
