import api from './api';
import { CampaignVariant } from '../types';

export const abTestsService = {
  async list(campaignId: number): Promise<CampaignVariant[]> {
    const { data } = await api.get<CampaignVariant[]>(`/api/campaigns/${campaignId}/variants`);
    return data;
  },

  async create(campaignId: number, payload: { name: string; description?: string; material_url?: string }): Promise<CampaignVariant> {
    const { data } = await api.post<CampaignVariant>(`/api/campaigns/${campaignId}/variants`, payload);
    return data;
  },

  async update(campaignId: number, variantId: number, payload: Partial<{ name: string; description: string; material_url: string; impressions: number; conversions: number; is_winner: boolean }>): Promise<CampaignVariant> {
    const { data } = await api.put<CampaignVariant>(`/api/campaigns/${campaignId}/variants/${variantId}`, payload);
    return data;
  },

  async remove(campaignId: number, variantId: number): Promise<void> {
    await api.delete(`/api/campaigns/${campaignId}/variants/${variantId}`);
  },

  async declareWinner(campaignId: number, variantId: number): Promise<CampaignVariant> {
    const { data } = await api.post<CampaignVariant>(`/api/campaigns/${campaignId}/variants/${variantId}/declare-winner`);
    return data;
  },
};
