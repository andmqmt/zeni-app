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
  const d = typeof date === 'string' ? parseDateStringToLocal(date) : date;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateLong = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseDateStringToLocal(date) : date;
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const day = d.getDate();
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
};

export const formatDateShort = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseDateStringToLocal(date) : date;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (d.toDateString() === today.toDateString()) {
    return 'Hoje';
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  }
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

export const formatMonthYear = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseDateStringToLocal(date) : date;
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[d.getMonth()]} de ${d.getFullYear()}`;
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
