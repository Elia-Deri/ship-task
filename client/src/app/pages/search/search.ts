import { DatePipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import {
  AbstractControl,
  FormGroupDirective,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  DateRange,
  DefaultMatCalendarRangeStrategy,
  MAT_DATE_RANGE_SELECTION_STRATEGY,
  MatCalendar,
} from '@angular/material/datepicker';

import { SuppliersService } from '../../service/suppliers';

class ShowOnSubmitErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | null): boolean {
    return !!control?.invalid && !!form?.submitted;
  }
}

@Component({
  imports: [
    DatePipe,
    MatCalendar,
    MatInputModule,
    MatButtonModule,
    CdkOverlayOrigin,
    MatFormFieldModule,
    CdkConnectedOverlay,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: MAT_DATE_RANGE_SELECTION_STRATEGY, useClass: DefaultMatCalendarRangeStrategy },
    { provide: ErrorStateMatcher, useClass: ShowOnSubmitErrorStateMatcher },
  ],
  selector: 'app-search',
  styleUrl: './search.css',
  templateUrl: './search.html',
})
export class Search {
  private readonly suppliersService = inject(SuppliersService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly form = this.fb.group({
    source: ['', Validators.required],
    destination: ['', Validators.required],
    startDate: [null as Date | null, Validators.required],
    endDate: [null as Date | null, Validators.required],
    suppliers: [[] as string[], Validators.required],
  });

  readonly isCalendarOpen = signal(false);
  readonly suppliers = signal<string[]>([]);
  protected readonly startDate = toSignal(this.form.controls.startDate.valueChanges, {
    initialValue: null,
  });
  protected readonly endDate = toSignal(this.form.controls.endDate.valueChanges, {
    initialValue: null,
  });
  protected readonly selectedRange = computed(
    () => new DateRange(this.startDate(), this.endDate()),
  );

  constructor() {
    this.suppliersService
      .getAll()
      .pipe(takeUntilDestroyed())
      .subscribe((availableSuppliers) => {
        this.suppliers.set(availableSuppliers);
        this.form.controls.suppliers.setValue(availableSuppliers);
      });
  }

  submit() {}

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
