import { ErrorStateMatcher } from '@angular/material/core';
import { AbstractControl, FormGroupDirective } from '@angular/forms';

export class ShowOnSubmitErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | null): boolean {
    return !!control?.invalid && !!form?.submitted;
  }
}

// The calendar yields local midnight; the server needs the same calendar day regardless of the browser's timezone.
export function toUtcMidnight(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}
