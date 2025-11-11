'use client';

import Loading from '@/components/Loading';

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loading text="Carregando dados..." size="lg" />
    </div>
  );
}
