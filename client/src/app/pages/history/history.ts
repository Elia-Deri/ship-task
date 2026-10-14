import { catchError, of, switchMap, tap } from 'rxjs';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';

import { HistoryService } from '@/app/service/history';
import { HistoryTable } from './history-table/history-table';
import { HistoryFilters } from './history-filters/history-filters';
import { HistoryFilterValues, HistoryRow } from '@/app/models/history';

@Component({
  imports: [HistoryTable, HistoryFilters],
  selector: 'app-history',
  host: { class: 'block' },
  templateUrl: './history.html',
})
export class History {
  private readonly historyService = inject(HistoryService);

  readonly filters = signal<HistoryFilterValues>({
    startDate: null,
    endDate: null,
    supplierIds: [],
    routes: [],
  });
  protected readonly rows = signal<HistoryRow[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly routes = toSignal(
    this.historyService.getRoutes().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  constructor() {
    toObservable(this.filters)
      .pipe(
        tap(() => {
          this.isLoading.set(true);
          this.hasError.set(false);
        }),
        switchMap((filters) =>
          this.historyService.getRows(filters).pipe(
            catchError(() => {
              this.hasError.set(true);
              return of([]);
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((rows) => {
        this.rows.set(rows);
        this.isLoading.set(false);
      });
  }
}
