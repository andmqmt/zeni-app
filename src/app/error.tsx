'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Algo deu errado!</h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'Ocorreu um erro inesperado.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
