import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { Search } from './search';

describe('Search', () => {
  let component: Search;
  let fixture: ComponentFixture<Search>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Search],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Search);
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
