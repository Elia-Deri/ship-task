import { map, Observable } from 'rxjs';
import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { isLocationList } from '@/app/models/location';

@Service()
export class LocationsService {
  private readonly http = inject(HttpClient);

  search(query: string): Observable<string[]> {
    return this.http.get<unknown>('/locations', { params: { query } }).pipe(
      map((response) => {
        if (!isLocationList(response)) {
          throw new Error('Invalid location list response.');
        }

        return response;
      }),
    );
  }
}
