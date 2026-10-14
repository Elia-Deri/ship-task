import { inject, Service } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { map, Observable } from 'rxjs';

import {
  HistoryFilterValues,
  HistoryRoute,
  HistoryRow,
  isHistoryRouteList,
  isHistoryRowList,
} from '@/app/models/history';

@Service()
export class HistoryService {
  private readonly http = inject(HttpClient);

  getRows(filters: HistoryFilterValues): Observable<HistoryRow[]> {
    let params = new HttpParams();
    if (filters.startDate !== null) params = params.set('startDate', filters.startDate);
    if (filters.endDate !== null) params = params.set('endDate', filters.endDate);

    filters.supplierIds.forEach(
      (supplierId) => (params = params.append('supplierIds', supplierId)),
    );
    filters.routes.forEach((route, index) => {
      params = params
        .set(`routes[${index}].source`, route.source)
        .set(`routes[${index}].destination`, route.destination);
    });

    return this.http.get<unknown>('/history', { params }).pipe(
      map((response) => {
        if (!isHistoryRowList(response)) {
          throw new Error('Invalid history response.');
        }

        return response;
      }),
    );
  }

  getRoutes(): Observable<HistoryRoute[]> {
    return this.http.get<unknown>('/history/routes').pipe(
      map((response) => {
        if (!isHistoryRouteList(response)) {
          throw new Error('Invalid history routes response.');
        }

        return response;
      }),
    );
  }
}
