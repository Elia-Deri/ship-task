import { catchError, of, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Component, computed, ElementRef, inject, signal, viewChild } from '@angular/core';
import {
  DateRange,
  DefaultMatCalendarRangeStrategy,
  MAT_DATE_RANGE_SELECTION_STRATEGY,
  MatCalendar,
} from '@angular/material/datepicker';

import { DateDisplay } from './date-display';
import { Supplier } from '@/app/models/supplier';
import { SearchService } from '@/app/service/search';
import { SuppliersService } from '@/app/service/suppliers';
import { ShowOnSubmitErrorStateMatcher, toUtcMidnight } from './utils';

@Component({
  imports: [
    DateDisplay,
    MatCalendar,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    CdkOverlayOrigin,
    MatFormFieldModule,
    CdkConnectedOverlay,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: DefaultMatCalendarRangeStrategy },
    { provide: ErrorStateMatcher, useClass: ShowOnSubmitErrorStateMatcher },
  ],
  selector: 'app-search-form',
  host: { class: 'block' },
  styleUrl: './search-form.css',
  templateUrl: './search-form.html',
})
export class SearchForm {
  private readonly searchService = inject(SearchService);
  private readonly suppliersService = inject(SuppliersService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly datesOrigin = viewChild.required('datesOrigin', { read: CdkOverlayOrigin });
  private readonly calendarPanel = viewChild<ElementRef<HTMLElement>>('calendarPanel');

  readonly form = this.fb.group({
    source: ['', Validators.required],
    destination: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    suppliers: [[] as Supplier[], Validators.required],
  });

  readonly isCalendarOpen = signal(false);
  protected readonly hasSuppliersError = signal(false);
  protected readonly suppliers = toSignal(
    this.suppliersService.getAll().pipe(
      tap((availableSuppliers) => this.form.controls.suppliers.setValue(availableSuppliers)),
      catchError(() => {
        this.hasSuppliersError.set(true);
        return of([]);
      }),
    ),
    { initialValue: [] },
  );
  protected readonly startDate = toSignal(this.form.controls.startDate.valueChanges, {
    initialValue: null,
  });
  protected readonly endDate = toSignal(this.form.controls.endDate.valueChanges, {
    initialValue: null,
  });
  protected readonly selectedRange = computed(
    () => new DateRange(this.startDate(), this.endDate()),
  );

  submit(): void {
    const { source, destination, startDate, endDate, suppliers } = this.form.getRawValue();
    if (this.form.invalid || !startDate || !endDate) return;

    this.searchService.search({
      source: source.trim(),
      destination: destination.trim(),
      startDate: toUtcMidnight(startDate),
      endDate: toUtcMidnight(endDate),
      supplierIds: suppliers.map((supplier) => supplier.id),
    });
  }

  swapRoute(): void {
    const { source, destination } = this.form.controls;
    this.form.patchValue({ source: destination.value, destination: source.value });
  }

  closeCalendarIfFocusLeft(event: FocusEvent): void {
    const nextFocus = event.relatedTarget;
    const isFocusStaying =
      nextFocus instanceof Node &&
      (this.datesOrigin().elementRef.nativeElement.contains(nextFocus) ||
        !!this.calendarPanel()?.nativeElement.contains(nextFocus));

    if (!isFocusStaying) this.changeCalendarState(false);
  }

  changeCalendarState(newState: boolean) {
    this.isCalendarOpen.set(newState);
  }

  selectDate(date: Date | null): void {
    if (!date) return;

    const { startDate, endDate } = this.form.controls;
    const isStartingNewRange =
      !startDate.value || endDate.value !== null || date.getTime() < startDate.value.getTime();

    if (isStartingNewRange) {
      startDate.setValue(date);
      endDate.setValue(null);
      return;
    }

    endDate.setValue(date);
    this.changeCalendarState(false);
  }
}
