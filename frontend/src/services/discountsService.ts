import api from './api';
import { DiscountProgram, DiscountProgramCreate, DiscountProgramUpdate } from '../types';

export const discountsService = {
  async list(): Promise<DiscountProgram[]> {
    const { data } = await api.get<DiscountProgram[]>('/api/discounts');
    return data;
  },

  async create(payload: DiscountProgramCreate): Promise<DiscountProgram> {
    const { data } = await api.post<DiscountProgram>('/api/discounts', payload);
    return data;
  },

  async update(id: number, payload: DiscountProgramUpdate): Promise<DiscountProgram> {
    const { data } = await api.put<DiscountProgram>(`/api/discounts/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/discounts/${id}`);
  },
};
