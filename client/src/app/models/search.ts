export interface SearchRequest {
  source: string;
  destination: string;
  startDate: number;
  endDate: number;
  supplierIds: number[];
}

export interface SupplierQuote {
  supplierId: number;
  supplierName: string;
  price: number;
}

export interface SupplierFailure {
  supplierId: number;
  supplierName: string;
}

export type SearchStatus = 'running' | 'completed' | 'timedOut' | 'error';

export type SearchEvent =
  | { type: 'started'; searchId: number; supplierCount: number }
  | { type: 'quote'; quote: SupplierQuote }
  | { type: 'failed'; supplierId: number; supplierName: string }
  | { type: 'ended'; status: 'completed' | 'timedOut' };

export function parseSearchEvent(value: unknown): SearchEvent {
  if (isRecord(value)) {
    switch (value['type']) {
      case 'started':
        if (typeof value['searchId'] === 'number' && typeof value['supplierCount'] === 'number') {
          return {
            type: 'started',
            searchId: value['searchId'],
            supplierCount: value['supplierCount'],
          };
        }
        break;
      case 'quote': {
        const quote = value['quote'];
        if (
          isRecord(quote) &&
          typeof quote['supplierId'] === 'number' &&
          typeof quote['supplierName'] === 'string' &&
          typeof quote['price'] === 'number'
        ) {
          return {
            type: 'quote',
            quote: {
              supplierId: quote['supplierId'],
              supplierName: quote['supplierName'],
              price: quote['price'],
            },
          };
        }
        break;
      }
      case 'failed':
        if (typeof value['supplierId'] === 'number' && typeof value['supplierName'] === 'string') {
          return {
            type: 'failed',
            supplierId: value['supplierId'],
            supplierName: value['supplierName'],
          };
        }
        break;
      case 'ended':
        if (value['status'] === 'completed' || value['status'] === 'timedOut') {
          return { type: 'ended', status: value['status'] };
        }
        break;
    }
  }

  throw new Error(`Invalid search event: ${JSON.stringify(value)}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
