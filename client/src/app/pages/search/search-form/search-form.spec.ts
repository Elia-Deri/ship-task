import { NEVER } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { SearchForm } from './search-form';
import { SearchService } from '@/app/service/search';
import { SearchStream } from '@/app/service/search-stream';

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
        { provide: SearchStream, useValue: { open: () => NEVER } },
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

  it('starts a search with the trimmed form values', async () => {
    httpTesting.expectOne('/suppliers').flush([{ id: 1, name: 'Cheetah' }]);
    await fixture.whenStable();
    const search = vi.spyOn(TestBed.inject(SearchService), 'search');

    component.form.patchValue({
      source: ' Haifa ',
      destination: 'Rotterdam',
      startDate: new Date(2026, 9, 14),
      endDate: new Date(2026, 9, 20),
    });
    (fixture.nativeElement as HTMLElement)
      .querySelector('form')
      ?.dispatchEvent(new Event('submit'));

    expect(search).toHaveBeenCalledWith({
      source: 'Haifa',
      destination: 'Rotterdam',
      startDate: Date.UTC(2026, 9, 14),
      endDate: Date.UTC(2026, 9, 20),
      supplierIds: [1],
    });
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
