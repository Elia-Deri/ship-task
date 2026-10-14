import { AgGridAngular } from 'ag-grid-angular';
import { formatCurrency, formatDate } from '@angular/common';
import { Component, inject, input, LOCALE_ID } from '@angular/core';
import {
  ColDef,
  GetRowIdParams,
  NumberFilterModule,
  PaginationModule,
  ClientSideRowModelModule,
} from 'ag-grid-community';

import { HistoryRow } from '@/app/models/history';

// AG Grid negates the result for descending sorts, so failures must flip sides to stay last.
export function comparePricesFailedLast(
  priceA: number | null,
  priceB: number | null,
  isDescending: boolean,
): number {
  if (priceA === null && priceB === null) return 0;
  if (priceA === null) return isDescending ? -1 : 1;
  if (priceB === null) return isDescending ? 1 : -1;
  return priceA - priceB;
}

@Component({
  imports: [AgGridAngular],
  selector: 'app-history-table',
  host: { class: 'block' },
  templateUrl: './history-table.html',
})
export class HistoryTable {
  private readonly locale = inject(LOCALE_ID);

  readonly rows = input.required<HistoryRow[]>();
  readonly isLoading = input(false);
  protected readonly modules = [ClientSideRowModelModule, PaginationModule, NumberFilterModule];

  protected readonly defaultColDef: ColDef<HistoryRow> = { flex: 1, sortable: true };
  protected readonly columnDefs: ColDef<HistoryRow>[] = [
    {
      headerName: 'Date',
      field: 'respondedAt',
      sort: 'desc',
      valueFormatter: ({ data }) =>
        data ? formatDate(data.respondedAt, 'd MMM y, HH:mm', this.locale) : '',
    },
    {
      headerName: 'Route',
      valueGetter: ({ data }) => (data ? `${data.source} → ${data.destination}` : ''),
    },
    { headerName: 'Supplier', field: 'supplierName' },
    {
      headerName: 'Price',
      filter: 'agNumberColumnFilter',
      valueGetter: ({ data }) => (data?.price != null ? data.price / 100 : null),
      comparator: (priceA, priceB, _nodeA, _nodeB, isDescending) =>
        comparePricesFailedLast(priceA, priceB, isDescending),
      valueFormatter: ({ data }) =>
        data?.price != null
          ? formatCurrency(data.price / 100, this.locale, '$', 'USD', '1.0-0')
          : 'Failed',
    },
    {
      headerName: 'Response time',
      field: 'responseTimeMs',
      filter: 'agNumberColumnFilter',
      valueFormatter: ({ data }) => (data ? `${data.responseTimeMs} ms` : ''),
    },
  ];

  protected readonly getRowId = ({ data }: GetRowIdParams<HistoryRow>) => String(data.id);
}
