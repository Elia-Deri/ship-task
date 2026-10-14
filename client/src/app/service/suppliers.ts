import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { map, Observable } from 'rxjs';

import { isSupplierList, Supplier } from '../models/supplier';

@Service()
export class SuppliersService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Supplier[]> {
    return this.http.get<unknown>('/suppliers').pipe(
      map((response) => {
        if (!isSupplierList(response)) {
          throw new Error('Invalid supplier list response.');
        }

        return response;
      }),
    );
  }
}
