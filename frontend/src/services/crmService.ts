import api from './api';
import { Contract, Task, TimeLog, ClientContact, Vendor, Lead } from '../types';

export const crmService = {
  // Contracts
  async listContracts(params?: { client_id?: number; status?: string }): Promise<Contract[]> {
    const { data } = await api.get<Contract[]>('/api/contracts', { params });
    return data;
  },
  async createContract(payload: { client_id: number; title: string; order_id?: number; content?: string; expires_at?: string }): Promise<Contract> {
    const { data } = await api.post<Contract>('/api/contracts', payload);
    return data;
  },
  async updateContract(id: number, payload: Partial<{ title: string; content: string; status: string; signed_at: string; expires_at: string }>): Promise<Contract> {
    const { data } = await api.put<Contract>(`/api/contracts/${id}`, payload);
    return data;
  },
  async removeContract(id: number): Promise<void> {
    await api.delete(`/api/contracts/${id}`);
  },

  // Tasks
  async listTasks(params?: { order_id?: number; assigned_to_id?: number; status?: string; priority?: string }): Promise<Task[]> {
    const { data } = await api.get<Task[]>('/api/tasks', { params });
    return data;
  },
  async createTask(payload: { title: string; order_id?: number; assigned_to_id?: number; description?: string; priority?: string; due_date?: string }): Promise<Task> {
    const { data } = await api.post<Task>('/api/tasks', payload);
    return data;
  },
  async updateTask(id: number, payload: Partial<{ title: string; description: string; status: string; priority: string; assigned_to_id: number; due_date: string }>): Promise<Task> {
    const { data } = await api.put<Task>(`/api/tasks/${id}`, payload);
    return data;
  },
  async removeTask(id: number): Promise<void> {
    await api.delete(`/api/tasks/${id}`);
  },
  async logTime(taskId: number, payload: { hours: number; logged_at: string; description?: string }): Promise<TimeLog> {
    const { data } = await api.post<TimeLog>(`/api/tasks/${taskId}/time-logs`, payload);
    return data;
  },
  async listTimeLogs(taskId: number): Promise<TimeLog[]> {
    const { data } = await api.get<TimeLog[]>(`/api/tasks/${taskId}/time-logs`);
    return data;
  },

  // Client Contacts
  async listContacts(clientId: number): Promise<ClientContact[]> {
    const { data } = await api.get<ClientContact[]>('/api/client-contacts', { params: { client_id: clientId } });
    return data;
  },
  async createContact(payload: { client_id: number; name: string; email?: string; phone?: string; role?: string; is_primary?: boolean }): Promise<ClientContact> {
    const { data } = await api.post<ClientContact>('/api/client-contacts', payload);
    return data;
  },
  async updateContact(id: number, payload: Partial<{ name: string; email: string; phone: string; role: string; is_primary: boolean }>): Promise<ClientContact> {
    const { data } = await api.put<ClientContact>(`/api/client-contacts/${id}`, payload);
    return data;
  },
  async removeContact(id: number): Promise<void> {
    await api.delete(`/api/client-contacts/${id}`);
  },

  // Vendors
  async listVendors(params?: { search?: string; specialty?: string }): Promise<Vendor[]> {
    const { data } = await api.get<Vendor[]>('/api/vendors', { params });
    return data;
  },
  async createVendor(payload: { name: string; email?: string; phone?: string; specialty?: string; rating?: number; notes?: string }): Promise<Vendor> {
    const { data } = await api.post<Vendor>('/api/vendors', payload);
    return data;
  },
  async updateVendor(id: number, payload: Partial<{ name: string; email: string; phone: string; specialty: string; rating: number; notes: string }>): Promise<Vendor> {
    const { data } = await api.put<Vendor>(`/api/vendors/${id}`, payload);
    return data;
  },
  async removeVendor(id: number): Promise<void> {
    await api.delete(`/api/vendors/${id}`);
  },

  // Leads
  async listLeads(params?: { status?: string; source?: string; assigned_to_id?: number }): Promise<Lead[]> {
    const { data } = await api.get<Lead[]>('/api/leads', { params });
    return data;
  },
  async createLead(payload: { name: string; email?: string; phone?: string; company?: string; source?: string; notes?: string; assigned_to_id?: number }): Promise<Lead> {
    const { data } = await api.post<Lead>('/api/leads', payload);
    return data;
  },
  async updateLead(id: number, payload: Partial<{ name: string; email: string; phone: string; company: string; source: string; status: string; notes: string; assigned_to_id: number }>): Promise<Lead> {
    const { data } = await api.put<Lead>(`/api/leads/${id}`, payload);
    return data;
  },
  async removeLead(id: number): Promise<void> {
    await api.delete(`/api/leads/${id}`);
  },
  async convertLead(id: number): Promise<Lead> {
    const { data } = await api.post<Lead>(`/api/leads/${id}/convert`);
    return data;
  },
};
