import { api } from './client';
import { Recurring, RecurringCreate, MaterializeResponse } from '@/types';

export const recurringService = {
  async getAll(): Promise<Recurring[]> {
    const { data } = await api.get<Recurring[]>('/recurring/');
    return data;
  },

  async create(recurring: RecurringCreate): Promise<Recurring> {
    const { data } = await api.post<Recurring>('/recurring/', recurring);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/recurring/${id}`);
  },

  async materialize(upToDate: string): Promise<MaterializeResponse> {
    const { data } = await api.post<MaterializeResponse>('/recurring/materialize', {
      up_to_date: upToDate,
    });
    return data;
  },
};
