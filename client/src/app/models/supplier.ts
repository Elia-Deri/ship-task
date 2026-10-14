export interface Supplier {
  id: number;
  name: string;
}

export function isSupplierList(value: unknown): value is Supplier[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item: unknown) =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        typeof item.id === 'number' &&
        'name' in item &&
        typeof item.name === 'string',
    )
  );
}
