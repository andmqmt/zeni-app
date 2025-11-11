'use client';

import { useBalanceVisibility } from '@/contexts/BalanceVisibilityContext';
import { formatCurrency } from '@/lib/utils/format';

interface CurrencyDisplayProps {
  value: number | string | undefined | null;
  className?: string;
}

export default function CurrencyDisplay({ value, className = '' }: CurrencyDisplayProps) {
  const { isVisible } = useBalanceVisibility();
  
  // Convert to number safely
  const toNumber = (val: number | string | undefined | null): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  };
  
  const safeValue = toNumber(value);
  
  return (
    <span className={className}>
      {formatCurrency(safeValue, !isVisible)}
    </span>
  );
}
