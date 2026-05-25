import api from './api';
import { AdPlacement, ContentCalendarEntry } from '../types';

export const placementsService = {
  async listPlacements(params?: { campaign_id?: number; channel_id?: number; status?: string }): Promise<AdPlacement[]> {
    const { data } = await api.get<AdPlacement[]>('/api/placements', { params });
    return data;
  },

  async createPlacement(payload: { campaign_id: number; channel_id: number; scheduled_at: string; duration_seconds?: number; position?: string; cost_per_slot?: number; notes?: string }): Promise<AdPlacement> {
    const { data } = await api.post<AdPlacement>('/api/placements', payload);
    return data;
  },

  async updatePlacement(id: number, payload: Partial<{ scheduled_at: string; duration_seconds: number; position: string; cost_per_slot: number; status: string; notes: string }>): Promise<AdPlacement> {
    const { data } = await api.put<AdPlacement>(`/api/placements/${id}`, payload);
    return data;
  },

  async removePlacement(id: number): Promise<void> {
    await api.delete(`/api/placements/${id}`);
  },

  async listCalendar(params?: { campaign_id?: number; month?: string }): Promise<ContentCalendarEntry[]> {
    const { data } = await api.get<ContentCalendarEntry[]>('/api/content-calendar', { params });
    return data;
  },

  async createCalendarEntry(payload: { campaign_id: number; title: string; content_type: string; scheduled_date: string; notes?: string }): Promise<ContentCalendarEntry> {
    const { data } = await api.post<ContentCalendarEntry>('/api/content-calendar', payload);
    return data;
  },

  async updateCalendarEntry(id: number, payload: Partial<{ title: string; content_type: string; scheduled_date: string; status: string; notes: string }>): Promise<ContentCalendarEntry> {
    const { data } = await api.put<ContentCalendarEntry>(`/api/content-calendar/${id}`, payload);
    return data;
  },

  async removeCalendarEntry(id: number): Promise<void> {
    await api.delete(`/api/content-calendar/${id}`);
  },
};
