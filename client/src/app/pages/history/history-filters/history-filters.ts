import { catchError, of, tap } from 'rxjs';
import { MatSelectModule } from '@angular/material/select';
import { Component, inject, input, output } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';

import { toUtcMidnight } from '@/app/utils';
import { SuppliersService } from '@/app/service/suppliers';
import { HistoryFilterValues, HistoryRoute } from '@/app/models/history';

@Component({
  imports: [MatSelectModule, MatFormFieldModule, MatDatepickerModule, ReactiveFormsModule],
  selector: 'app-history-filters',
  host: { class: 'block' },
  templateUrl: './history-filters.html',
})
export class HistoryFilters {
  private readonly suppliersService = inject(SuppliersService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly routes = input.required<HistoryRoute[]>();
  readonly filtersChange = output<HistoryFilterValues>();

  readonly form = this.fb.group({
    startDate: [null as Date | null],
    endDate: [null as Date | null],
    supplierIds: [[] as number[]],
    routes: [[] as HistoryRoute[]],
  });

  protected readonly suppliers = toSignal(
    this.suppliersService.getAll().pipe(
      tap((availableSuppliers) =>
        this.form.controls.supplierIds.setValue(availableSuppliers.map((supplier) => supplier.id)),
      ),
      catchError(() => of([])),
    ),
    { initialValue: [] },
  );

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      const { startDate, endDate, supplierIds, routes } = this.form.getRawValue();
      this.filtersChange.emit({
        startDate: startDate ? toUtcMidnight(startDate) : null,
        endDate: endDate ? toUtcMidnight(endDate) : null,
        supplierIds,
        routes,
      });
    });
  }

  // The route list is reloaded from the server, so selections must match by value, not by reference.
  protected compareRoutes(first: HistoryRoute, second: HistoryRoute): boolean {
    return first.source === second.source && first.destination === second.destination;
  }
}
