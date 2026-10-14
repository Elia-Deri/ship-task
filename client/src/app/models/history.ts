import { isRecord } from '@/app/utils';

export interface HistoryRoute {
  source: string;
  destination: string;
}

export interface HistoryFilterValues {
  startDate: number | null;
  endDate: number | null;
  supplierIds: number[];
  routes: HistoryRoute[];
}

export interface HistoryRow {
  id: number;
  respondedAt: number;
  source: string;
  destination: string;
  supplierName: string;
  price: number | null;
  responseTimeMs: number;
}

export function isHistoryRowList(value: unknown): value is HistoryRow[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) =>
        isRecord(item) &&
        typeof item['id'] === 'number' &&
        typeof item['respondedAt'] === 'number' &&
        typeof item['source'] === 'string' &&
        typeof item['destination'] === 'string' &&
        typeof item['supplierName'] === 'string' &&
        (typeof item['price'] === 'number' || item['price'] === null) &&
        typeof item['responseTimeMs'] === 'number',
    )
  );
}

export function isHistoryRouteList(value: unknown): value is HistoryRoute[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) =>
        isRecord(item) &&
        typeof item['source'] === 'string' &&
        typeof item['destination'] === 'string',
    )
  );
}
