'use client';

import { Sparkles } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

export default function Loading() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-900 dark:bg-gray-100">
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="text-center text-white dark:text-gray-900">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-white/10 dark:bg-gray-900/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <BrandMark size={40} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Zeni</h1>
          </div>

          <div className="relative mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-full border-4 border-white/20 dark:border-gray-900/20" />
            <div className="w-16 h-16 absolute inset-0 rounded-full border-4 border-transparent border-t-white dark:border-t-gray-900 animate-spin" />
          </div>

          <p className="mt-5 opacity-80 font-medium">
            Preparando sua experiência...
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium opacity-70 bg-white/10 dark:bg-gray-900/10 px-3 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            Interface inteligente
          </div>
        </div>
      </div>
    </div>
  );
}
