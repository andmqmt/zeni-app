'use client';

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando dados...</p>
      </div>
    </div>
  );
}
