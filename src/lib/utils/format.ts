export const formatCurrency = (value: number, hidden: boolean = false): string => {
  if (hidden) {
    return '•••••';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  // Important: Strings like 'YYYY-MM-DD' are parsed as UTC by new Date(),
  // which can shift the displayed day in locales behind UTC (e.g., -03:00).
  // To avoid off-by-one errors, detect date-only strings and construct a
  // local Date at midnight.
  const d = typeof date === 'string' ? parseDateStringToLocal(date) : date;
  // Brazilian numeric format with hyphens: dd-MM-yyyy
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

export const formatISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseNumber = (value: string): number => {
  return parseFloat(value.replace(',', '.'));
};

// Parses a date string safely in local time when it's date-only (YYYY-MM-DD).
// Falls back to the native Date parser for other formats (e.g., ISO with time).
const parseDateStringToLocal = (value: string): Date => {
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;
  if (isoDateOnly.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
};
