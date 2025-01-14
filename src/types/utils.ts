export type Optional<T> = T | undefined;
export type Nullable<T> = T | null;

export function isNullOrUndefined<T>(value: Optional<Nullable<T>>): value is null | undefined {
  return value === null || value === undefined;
}

export function assertNonNullable<T>(value: T, message?: string): asserts value is NonNullable<T> {
  if (isNullOrUndefined(value)) {
    throw new Error(message ?? 'Value cannot be null or undefined');
  }
}

export function ensureArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isValidIndex(index: number, array: unknown[]): boolean {
  return isNumber(index) && index >= 0 && index < array.length;
}

export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}

export function ensureString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
}