'use client';

import { Sparkles } from 'lucide-react';
import BrandMark from '@/components/BrandMark';

export default function Loading() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-gray-900">
      {/* subtle pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
      </div>

      {/* glows */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/20 dark:bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-accent-500/30 dark:bg-accent-500/20 rounded-full blur-3xl" />

      {/* content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="text-center text-white">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl shadow-black/20">
              <BrandMark size={40} />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight">Zeni</h1>
          </div>

          {/* spinner consistent with app */}
          <div className="relative mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-full border-4 border-white/20" />
            <div className="w-16 h-16 absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin" />
            <div className="w-16 h-16 absolute inset-0 rounded-full bg-white/10 blur-sm animate-pulse" />
          </div>

          <p className="mt-5 text-primary-100/90 font-medium">
            Preparando sua experiência...
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary-100/90 bg-white/10 px-2.5 py-1 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            Interface inteligente
          </div>
        </div>
      </div>
    </div>
  );
}
