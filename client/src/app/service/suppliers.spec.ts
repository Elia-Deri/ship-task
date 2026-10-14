import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { firstValueFrom } from 'rxjs';

import { SuppliersService } from './suppliers';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SuppliersService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('returns the supplier list', async () => {
    const suppliers = [
      { id: 1, name: 'Cheetah' },
      { id: 2, name: 'UPN' },
    ];
    const result = firstValueFrom(service.getAll());

    httpTesting.expectOne('/suppliers').flush(suppliers);

    await expect(result).resolves.toEqual(suppliers);
  });

  it('rejects a malformed response', async () => {
    const result = firstValueFrom(service.getAll());

    httpTesting.expectOne('/suppliers').flush([{ id: '1', name: 'Cheetah' }]);

    await expect(result).rejects.toThrow('Invalid supplier list response.');
  });
});
