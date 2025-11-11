'use client';

import { ReactNode } from 'react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  return (
    <span className="relative inline-flex group align-middle">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md bg-gray-900 text-white text-xs px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg dark:bg-gray-700"
      >
        {content}
      </span>
    </span>
  );
}
