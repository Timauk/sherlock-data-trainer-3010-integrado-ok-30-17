export const isNonNullable = <T>(value: T): value is NonNullable<T> => {
  return value !== null && value !== undefined;
};

export const isArrayNonEmpty = <T>(arr: T[] | null | undefined): arr is T[] => {
  return Array.isArray(arr) && arr.length > 0;
};

export const ensureArray = <T>(value: T | T[]): T[] => {
  return Array.isArray(value) ? value : [value];
};

export const ensureNumber = (value: any): number => {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export const ensureString = (value: any): string => {
  if (typeof value === 'string') {
    return value;
  }
  return String(value);
};

export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const ensureDate = (value: any): Date => {
  if (isValidDate(value)) {
    return value;
  }
  const date = new Date(value);
  return isValidDate(date) ? date : new Date();
};