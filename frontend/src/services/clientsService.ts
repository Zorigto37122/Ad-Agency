import api from './api';
import { Client, ClientCreate, ClientUpdate, ClientDetail } from '../types';

export const clientsService = {
  async list(): Promise<Client[]> {
    const { data } = await api.get<Client[]>('/api/clients');
    return data;
  },

  async get(id: number): Promise<ClientDetail> {
    const { data } = await api.get<ClientDetail>(`/api/clients/${id}`);
    return data;
  },

  async create(client: ClientCreate): Promise<Client> {
    const { data } = await api.post<Client>('/api/clients', client);
    return data;
  },

  async update(id: number, client: ClientUpdate): Promise<Client> {
    const { data } = await api.put<Client>(`/api/clients/${id}`, client);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/clients/${id}`);
  },
};
