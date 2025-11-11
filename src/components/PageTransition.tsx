'use client';

import { ReactNode, useEffect, useState } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        mounted 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-2'
      }`}
    >
      {children}
    </div>
  );
}
