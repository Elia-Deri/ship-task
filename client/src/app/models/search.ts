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
  priceMinor: number;
}

export type SearchStatus = 'running' | 'completed' | 'timedOut' | 'error';

export type SearchEvent =
  | { type: 'started'; searchId: number; supplierCount: number }
  | { type: 'quote'; quote: SupplierQuote }
  | { type: 'failed'; supplierId: number; supplierName: string }
  | { type: 'ended'; status: 'completed' | 'timedOut' };
