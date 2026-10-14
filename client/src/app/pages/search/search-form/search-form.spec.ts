import { NEVER, of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SearchForm } from './search-form';
import { SearchService } from '@/app/service/search';
import { LocationsService } from '@/app/service/locations';
import { SearchStream } from '@/app/service/search-stream';

const LOCATIONS = ['Port of Haifa, Israel', 'Port of Rotterdam, Netherlands'];

describe('SearchForm', () => {
  let component: SearchForm;
  let fixture: ComponentFixture<SearchForm>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchForm],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNativeDateAdapter(),
        { provide: SearchStream, useValue: { open: () => NEVER } },
        {
          provide: LocationsService,
          useValue: {
            search: (query: string) => of(LOCATIONS.filter((location) => location.includes(query))),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchForm);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('selects every supplier by default', async () => {
    const suppliers = [
      { id: 1, name: 'Cheetah' },
      { id: 2, name: 'UPN' },
    ];

    httpTesting.expectOne('/suppliers').flush(suppliers);
    await fixture.whenStable();

    expect(component.form.controls.suppliers.value).toEqual(suppliers);
  });

  it('marks empty dates as errors after submit', async () => {
    httpTesting.expectOne('/suppliers').flush([{ id: 1, name: 'Cheetah' }]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    const invalidLabels = Array.from(
      element.querySelectorAll('mat-form-field.mat-form-field-invalid mat-label'),
      (label) => label.textContent?.trim(),
    );
    expect(invalidLabels).toEqual(expect.arrayContaining(['Start date', 'End date']));
  });

  it('starts a search with the form values', async () => {
    httpTesting.expectOne('/suppliers').flush([{ id: 1, name: 'Cheetah' }]);
    await fixture.whenStable();
    const search = vi.spyOn(TestBed.inject(SearchService), 'search');

    component.form.patchValue({
      source: 'Port of Haifa, Israel',
      destination: 'Port of Rotterdam, Netherlands',
      startDate: new Date(2026, 9, 14),
      endDate: new Date(2026, 9, 20),
    });
    await vi.waitFor(() => expect(component.form.valid).toBe(true));
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));

    expect(search).toHaveBeenCalledWith({
      source: 'Port of Haifa, Israel',
      destination: 'Port of Rotterdam, Netherlands',
      startDate: Date.UTC(2026, 9, 14),
      endDate: Date.UTC(2026, 9, 20),
      supplierIds: [1],
    });
  });

  it('closes the calendar and searches when Search is clicked while the calendar is open', async () => {
    httpTesting.expectOne('/suppliers').flush([{ id: 1, name: 'Cheetah' }]);
    await fixture.whenStable();
    const search = vi.spyOn(TestBed.inject(SearchService), 'search');
    component.form.patchValue({
      source: 'Port of Haifa, Israel',
      destination: 'Port of Rotterdam, Netherlands',
      startDate: new Date(2026, 9, 14),
      endDate: new Date(2026, 9, 20),
    });
    await vi.waitFor(() => expect(component.form.valid).toBe(true));
    component.changeCalendarState(true);
    await fixture.whenStable();

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[type="submit"]')
      ?.click();

    expect(component.isCalendarOpen()).toBe(false);
    expect(search).toHaveBeenCalledOnce();
  });

  it('does not search while the form is invalid', async () => {
    httpTesting.expectOne('/suppliers').flush([{ id: 1, name: 'Cheetah' }]);
    await fixture.whenStable();
    const search = vi.spyOn(TestBed.inject(SearchService), 'search');

    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));

    expect(search).not.toHaveBeenCalled();
  });

  it('does not search when a location was typed instead of picked from the list', async () => {
    httpTesting.expectOne('/suppliers').flush([{ id: 1, name: 'Cheetah' }]);
    await fixture.whenStable();
    const search = vi.spyOn(TestBed.inject(SearchService), 'search');

    component.form.patchValue({
      source: 'Haifa',
      destination: 'Port of Rotterdam, Netherlands',
      startDate: new Date(2026, 9, 14),
      endDate: new Date(2026, 9, 20),
    });
    await vi.waitFor(() => expect(component.form.status).toBe('INVALID'));
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));

    expect(component.form.controls.source.errors).toEqual({ unknownLocation: true });
    expect(component.form.controls.destination.valid).toBe(true);
    expect(search).not.toHaveBeenCalled();
  });

  it('does not search while a location is still being checked', async () => {
    httpTesting.expectOne('/suppliers').flush([{ id: 1, name: 'Cheetah' }]);
    await fixture.whenStable();
    const search = vi.spyOn(TestBed.inject(SearchService), 'search');

    component.form.patchValue({
      source: 'Port of Haifa, Israel',
      destination: 'Port of Haifa, Israel',
      startDate: new Date(2026, 9, 14),
      endDate: new Date(2026, 9, 20),
    });
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));

    expect(component.form.status).toBe('PENDING');
    expect(search).not.toHaveBeenCalled();
  });

  it('loads location options with the current text when a route field gets focus', async () => {
    httpTesting.expectOne('/suppliers').flush([]);
    await fixture.whenStable();
    const search = vi.spyOn(TestBed.inject(LocationsService), 'search');
    const element = fixture.nativeElement as HTMLElement;

    element
      .querySelector('input[formControlName="source"]')
      ?.dispatchEvent(new FocusEvent('focus'));
    component.form.controls.destination.setValue('Port of Haifa, Israel', { emitEvent: false });
    element
      .querySelector('input[formControlName="destination"]')
      ?.dispatchEvent(new FocusEvent('focus'));

    expect(search.mock.calls).toEqual([[''], ['Port of Haifa, Israel']]);
  });

  it('swaps the origin and destination', async () => {
    httpTesting.expectOne('/suppliers').flush([]);
    await fixture.whenStable();
    component.form.patchValue({ source: 'Haifa', destination: 'Rotterdam' });

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.swap-btn')?.click();

    expect(component.form.controls.source.value).toBe('Rotterdam');
    expect(component.form.controls.destination.value).toBe('Haifa');
  });

  it('opens the calendar on focus and keeps it open while moving between the dates', async () => {
    httpTesting.expectOne('/suppliers').flush([]);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const startInput = element.querySelector<HTMLInputElement>(
      'input[formControlName="startDate"]',
    );
    const endInput = element.querySelector<HTMLInputElement>('input[formControlName="endDate"]');
    const sourceInput = element.querySelector<HTMLInputElement>('input[formControlName="source"]');

    startInput?.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(component.isCalendarOpen()).toBe(true);

    startInput?.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: endInput }),
    );
    expect(component.isCalendarOpen()).toBe(true);

    endInput?.dispatchEvent(
      new FocusEvent('focusout', { bubbles: true, relatedTarget: sourceInput }),
    );
    expect(component.isCalendarOpen()).toBe(false);
  });

  it('shows the selected dates formatted', async () => {
    httpTesting.expectOne('/suppliers').flush([]);

    component.form.controls.startDate.setValue(new Date(2026, 9, 14));
    await fixture.whenStable();

    const startInput = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[formControlName="startDate"]',
    );
    expect(startInput?.value).toBe('Wed, 14 Oct');
  });

  it('leaves the selection empty when suppliers fail to load', async () => {
    httpTesting
      .expectOne('/suppliers')
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    await fixture.whenStable();

    expect(component.form.controls.suppliers.value).toEqual([]);
  });
});
