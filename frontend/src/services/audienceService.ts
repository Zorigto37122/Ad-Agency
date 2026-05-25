import api from './api';
import { AudienceSegment } from '../types';

export const audienceService = {
  async list(params?: { gender?: string; income_level?: string; geography?: string }): Promise<AudienceSegment[]> {
    const { data } = await api.get<AudienceSegment[]>('/api/segments', { params });
    return data;
  },

  async get(id: number): Promise<AudienceSegment> {
    const { data } = await api.get<AudienceSegment>(`/api/segments/${id}`);
    return data;
  },

  async create(payload: { name: string; age_min?: number; age_max?: number; gender?: string; interests?: string; geography?: string; income_level?: string }): Promise<AudienceSegment> {
    const { data } = await api.post<AudienceSegment>('/api/segments', payload);
    return data;
  },

  async update(id: number, payload: Partial<{ name: string; age_min: number; age_max: number; gender: string; interests: string; geography: string; income_level: string }>): Promise<AudienceSegment> {
    const { data } = await api.put<AudienceSegment>(`/api/segments/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/api/segments/${id}`);
  },

  async getCampaignSegments(campaignId: number): Promise<AudienceSegment[]> {
    const { data } = await api.get<AudienceSegment[]>(`/api/campaigns/${campaignId}/segments`);
    return data;
  },

  async setCampaignSegments(campaignId: number, segmentIds: number[]): Promise<AudienceSegment[]> {
    const { data } = await api.put<AudienceSegment[]>(`/api/campaigns/${campaignId}/segments`, { segment_ids: segmentIds });
    return data;
  },
};
