import { Service } from '@angular/core';
import { Observable, of } from 'rxjs';

@Service()
export class SuppliersService {
  getAll(): Observable<string[]> {
    return of([]);
  }
  makeRequest() {}
}
