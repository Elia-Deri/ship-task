import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { LocationsService } from './locations';

describe('LocationsService', () => {
  let service: LocationsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(LocationsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('sends the query and returns the matching locations', async () => {
    const locations = ['Port of Haifa, Israel'];
    const result = firstValueFrom(service.search('haifa'));

    httpTesting.expectOne('/locations?query=haifa').flush(locations);

    await expect(result).resolves.toEqual(locations);
  });

  it('rejects a malformed response', async () => {
    const result = firstValueFrom(service.search('haifa'));

    httpTesting.expectOne('/locations?query=haifa').flush([1, 2]);

    await expect(result).rejects.toThrow('Invalid location list response.');
  });
});
