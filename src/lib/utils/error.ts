import { AxiosError } from 'axios';

interface ErrorResponse {
  detail?: string;
  message?: string;
}

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const response = error.response?.data as ErrorResponse;
    return response?.detail || response?.message || 'Erro ao processar solicitação';
  }
  return 'Erro inesperado';
};
