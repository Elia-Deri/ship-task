import { inject, Service } from '@angular/core';
import {
  concat,
  defer,
  map,
  merge,
  NEVER,
  Observable,
  of,
  switchMap,
  takeUntil,
  tap,
  timer,
} from 'rxjs';

import { SuppliersService } from './suppliers';
import { Supplier } from '@/app/models/supplier';
import { SearchEvent, SearchRequest } from '@/app/models/search';

// TODO: replace the simulation with fetch + SSE parsing against POST /api/searches.
@Service()
export class SearchStream {
  private readonly suppliersService = inject(SuppliersService);
  private nextSearchId = 1;

  open(request: SearchRequest): Observable<SearchEvent> {
    return this.suppliersService.getAll().pipe(
      switchMap((suppliers) => {
        const selected = suppliers.filter((supplier) => request.supplierIds.includes(supplier.id));
        const basePriceMinor = randomInt(50_000, 300_000);
        let pendingCount = selected.length;

        return concat(
          of<SearchEvent>({
            type: 'started',
            searchId: this.nextSearchId++,
            supplierCount: selected.length,
          }),
          merge(...selected.map((supplier) => simulateReply(supplier, basePriceMinor))).pipe(
            tap(() => pendingCount--),
            takeUntil(timer(6000)),
          ),
          defer(() =>
            of<SearchEvent>({
              type: 'ended',
              status: pendingCount === 0 ? 'completed' : 'timedOut',
            }),
          ),
        );
      }),
    );
  }
}

function simulateReply(supplier: Supplier, basePriceMinor: number): Observable<SearchEvent> {
  const roll = Math.random();
  if (roll < 0.1) {
    return NEVER;
  }

  return timer(randomInt(500, 5000)).pipe(
    map((): SearchEvent => {
      if (roll < 0.25) {
        return { type: 'failed', supplierId: supplier.id, supplierName: supplier.name };
      }

      const rawPriceMinor = randomInt(basePriceMinor * 0.95, basePriceMinor * 1.05);
      const quote = {
        supplierId: supplier.id,
        supplierName: supplier.name,
        priceMinor: Math.round(rawPriceMinor / 500) * 500,
      };
      return { type: 'quote', quote };
    }),
  );
}

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}
