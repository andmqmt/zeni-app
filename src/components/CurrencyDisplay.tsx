'use client';

import { useBalanceVisibility } from '@/contexts/BalanceVisibilityContext';
import { formatCurrency } from '@/lib/utils/format';

interface CurrencyDisplayProps {
  value: number;
  className?: string;
}

export default function CurrencyDisplay({ value, className = '' }: CurrencyDisplayProps) {
  const { isVisible } = useBalanceVisibility();
  const safeValue = Number.isFinite(value) ? value : 0;
  
  return (
    <span className={className}>
      {formatCurrency(safeValue, !isVisible)}
    </span>
  );
}
