import { formatDate } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Directive, ElementRef, forwardRef, inject, LOCALE_ID } from '@angular/core';

@Directive({
  selector: 'input[appDateDisplay]',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateDisplay), multi: true },
  ],
})
export class DateDisplay implements ControlValueAccessor {
  private readonly locale = inject(LOCALE_ID);
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef);

  writeValue(value: Date | null): void {
    this.element.nativeElement.value = value ? formatDate(value, 'EEE, d MMM', this.locale) : '';
  }

  registerOnChange(): void {}

  registerOnTouched(): void {}
}
