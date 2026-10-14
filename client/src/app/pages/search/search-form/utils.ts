import { ErrorStateMatcher } from '@angular/material/core';
import { catchError, map, Observable, of, switchMap, timer } from 'rxjs';
import { AbstractControl, FormGroupDirective, ValidationErrors } from '@angular/forms';

export function knownLocationValidator(
  searchLocations: (query: string) => Observable<string[]>,
): (control: AbstractControl) => Observable<ValidationErrors | null> {
  const unknownLocation = { unknownLocation: true };

  // Angular unsubscribes the previous validation on every keystroke, so the timer acts as a debounce.
  return (control) => {
    const location: unknown = control.value;
    if (typeof location !== 'string') return of(unknownLocation);

    return timer(250).pipe(
      switchMap(() => searchLocations(location)),
      map((locations) => (locations.includes(location) ? null : unknownLocation)),
      catchError(() => of(unknownLocation)),
    );
  };
}

export class ShowOnSubmitErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | null): boolean {
    return !!control?.invalid && !!form?.submitted;
  }
}

// The calendar yields local midnight; the server needs the same calendar day regardless of the browser's timezone.
export function toUtcMidnight(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}
