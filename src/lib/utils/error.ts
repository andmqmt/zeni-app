interface ErrorResponse {
  detail?: string;
  message?: string;
}

interface ApiError {
  response?: {
    data: ErrorResponse;
    status: number;
    statusText: string;
  };
  message?: string;
}

export const handleApiError = (error: unknown): string => {
  const apiError = error as ApiError;
  if (apiError?.response?.data) {
    const response = apiError.response.data;
    return response?.detail || response?.message || 'Erro ao processar solicitação';
  }
  if (apiError?.message) {
    return apiError.message;
  }
  return 'Erro inesperado';
};
