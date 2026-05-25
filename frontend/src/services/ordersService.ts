import api from './api';
import { Order, OrderCreate, OrderUpdate, OrderStatus } from '../types';

interface ListParams {
  status?: OrderStatus;
  client_id?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

export const ordersService = {
  async list(params: ListParams = {}): Promise<Order[]> {
    const { data } = await api.get<Order[]>('/api/orders', { params });
    return data;
  },

  async get(id: number): Promise<Order> {
    const { data } = await api.get<Order>(`/api/orders/${id}`);
    return data;
  },

  async create(order: OrderCreate): Promise<Order> {
    const { data } = await api.post<Order>('/api/orders', order);
    return data;
  },

  async update(id: number, order: OrderUpdate): Promise<Order> {
    const { data } = await api.put<Order>(`/api/orders/${id}`, order);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/orders/${id}`);
  },

  async uploadAttachment(id: number, file: File): Promise<Order> {
    const form = new FormData();
    form.append('file', file);
    const { data } = await api.post<Order>(`/api/orders/${id}/attachment`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async deleteAttachment(id: number): Promise<Order> {
    const { data } = await api.delete<Order>(`/api/orders/${id}/attachment`);
    return data;
  },

  async downloadAttachment(id: number, filename: string): Promise<void> {
    const response = await api.get(`/api/orders/${id}/attachment`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
