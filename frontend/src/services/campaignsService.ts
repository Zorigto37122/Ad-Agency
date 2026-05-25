import api from './api';
import { Campaign, CampaignMetric, CampaignReport, MediaChannel } from '../types';

export const campaignsService = {
  async list(params?: { order_id?: number; status?: string }): Promise<Campaign[]> {
    const { data } = await api.get<Campaign[]>('/api/campaigns', { params });
    return data;
  },

  async get(id: number): Promise<Campaign> {
    const { data } = await api.get<Campaign>(`/api/campaigns/${id}`);
    return data;
  },

  async create(payload: { order_id: number; name: string; description?: string; budget: number; start_date?: string; end_date?: string; channel_ids?: number[] }): Promise<Campaign> {
    const { data } = await api.post<Campaign>('/api/campaigns', payload);
    return data;
  },

  async update(id: number, payload: Partial<{ name: string; description: string; status: string; budget: number; start_date: string; end_date: string; channel_ids: number[] }>): Promise<Campaign> {
    const { data } = await api.put<Campaign>(`/api/campaigns/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/campaigns/${id}`);
  },

  async listMetrics(campaignId: number): Promise<CampaignMetric[]> {
    const { data } = await api.get<CampaignMetric[]>(`/api/campaigns/${campaignId}/metrics`);
    return data;
  },

  async addMetric(campaignId: number, payload: { date: string; impressions: number; clicks: number; conversions: number; spend: number; channel_id?: number }): Promise<CampaignMetric> {
    const { data } = await api.post<CampaignMetric>(`/api/campaigns/${campaignId}/metrics`, payload);
    return data;
  },

  async listReports(campaignId: number): Promise<CampaignReport[]> {
    const { data } = await api.get<CampaignReport[]>(`/api/campaigns/${campaignId}/reports`);
    return data;
  },

  async generateReport(campaignId: number, payload: { period: string; period_start: string; period_end: string }): Promise<CampaignReport> {
    const { data } = await api.post<CampaignReport>(`/api/campaigns/${campaignId}/reports`, payload);
    return data;
  },

  async listChannels(): Promise<MediaChannel[]> {
    const { data } = await api.get<MediaChannel[]>('/api/channels');
    return data;
  },

  async createChannel(payload: { name: string; channel_type: string; description?: string }): Promise<MediaChannel> {
    const { data } = await api.post<MediaChannel>('/api/channels', payload);
    return data;
  },

  async updateChannel(id: number, payload: Partial<{ name: string; channel_type: string; description: string }>): Promise<MediaChannel> {
    const { data } = await api.put<MediaChannel>(`/api/channels/${id}`, payload);
    return data;
  },

  async removeChannel(id: number): Promise<void> {
    await api.delete(`/api/channels/${id}`);
  },
};
