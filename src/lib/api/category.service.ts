import { api } from './client';
import { Category, CategoryCreate } from '@/types';

export const categoryService = {
  async getAll(): Promise<Category[]> {
    const { data } = await api.get<Category[]>('/categories/');
    return data;
  },

  async create(category: CategoryCreate): Promise<Category> {
    const { data } = await api.post<Category>('/categories/', category);
    return data;
  },

  async update(id: number, category: CategoryCreate): Promise<Category> {
    const { data } = await api.put<Category>(`/categories/${id}`, category);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};
