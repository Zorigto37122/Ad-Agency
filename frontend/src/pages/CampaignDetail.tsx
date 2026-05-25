import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CampaignMetric, CampaignReport, CampaignVariant } from '../types';
import { campaignsService } from '../services/campaignsService';
import { abTestsService } from '../services/abTestsService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function CampaignDetail({ addToast }: Props) {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || '0');

  const { data: campaign, loading } = useFetch(() => campaignsService.get(campaignId), [campaignId]);
  const { data: metrics, refetch: refetchMetrics } = useFetch<CampaignMetric[]>(() => campaignsService.listMetrics(campaignId), [campaignId]);
  const { data: reports, refetch: refetchReports } = useFetch<CampaignReport[]>(() => campaignsService.listReports(campaignId), [campaignId]);
  const { data: variants, refetch: refetchVariants } = useFetch<CampaignVariant[]>(() => abTestsService.list(campaignId), [campaignId]);

  const [metricForm, setMetricForm] = useState({ date: '', impressions: '', clicks: '', conversions: '', spend: '' });
  const [reportForm, setReportForm] = useState({ period: 'monthly', period_start: '', period_end: '' });
  const [variantForm, setVariantForm] = useState({ name: '', description: '', material_url: '' });
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showVariantForm, setShowVariantForm] = useState(false);

  const addMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await campaignsService.addMetric(campaignId, {
        date: metricForm.date,
        impressions: parseInt(metricForm.impressions) || 0,
        clicks: parseInt(metricForm.clicks) || 0,
        conversions: parseInt(metricForm.conversions) || 0,
        spend: parseFloat(metricForm.spend) || 0,
      });
      addToast('Метрика добавлена', 'success');
      setShowMetricForm(false);
      setMetricForm({ date: '', impressions: '', clicks: '', conversions: '', spend: '' });
      refetchMetrics();
    } catch { addToast('Ошибка', 'error'); }
  };

  const generateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await campaignsService.generateReport(campaignId, {
        period: reportForm.period,
        period_start: reportForm.period_start,
        period_end: reportForm.period_end,
      });
      addToast('Отчёт сформирован', 'success');
      setShowReportForm(false);
      refetchReports();
    } catch { addToast('Ошибка', 'error'); }
  };

  const addVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await abTestsService.create(campaignId, {
        name: variantForm.name,
        description: variantForm.description || undefined,
        material_url: variantForm.material_url || undefined,
      });
      addToast('Вариант добавлен', 'success');
      setShowVariantForm(false);
      setVariantForm({ name: '', description: '', material_url: '' });
      refetchVariants();
    } catch { addToast('Ошибка', 'error'); }
  };

  const declareWinner = async (variantId: number) => {
    try {
      await abTestsService.declareWinner(campaignId, variantId);
      addToast('Победитель объявлен', 'success');
      refetchVariants();
    } catch { addToast('Ошибка', 'error'); }
  };

  if (loading) return <div className="page-content"><p className="text-gray-500 text-sm">Загрузка...</p></div>;
  if (!campaign) return <div className="page-content"><p className="text-gray-500 text-sm">Кампания не найдена.</p></div>;

  return (
    <div className="page-content space-y-6">
      <div>
        <h1 className="page-title">{campaign.name}</h1>
        <p className="text-sm text-gray-500">Заказ #{campaign.order_id} · Бюджет: {campaign.budget.toLocaleString()} ₽</p>
        {campaign.description && <p className="text-sm text-gray-400 mt-1">{campaign.description}</p>}
      </div>

      {/* Metrics */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Метрики</h2>
          <button className="btn-primary text-xs py-1 px-3" onClick={() => setShowMetricForm(s => !s)}>+ Добавить</button>
        </div>
        {showMetricForm && (
          <form onSubmit={addMetric} className="grid grid-cols-3 gap-2">
            <input className="input" type="date" placeholder="Дата" value={metricForm.date} onChange={e => setMetricForm(f => ({ ...f, date: e.target.value }))} required />
            <input className="input" type="number" placeholder="Показы" value={metricForm.impressions} onChange={e => setMetricForm(f => ({ ...f, impressions: e.target.value }))} />
            <input className="input" type="number" placeholder="Клики" value={metricForm.clicks} onChange={e => setMetricForm(f => ({ ...f, clicks: e.target.value }))} />
            <input className="input" type="number" placeholder="Конверсии" value={metricForm.conversions} onChange={e => setMetricForm(f => ({ ...f, conversions: e.target.value }))} />
            <input className="input" type="number" step="0.01" placeholder="Расходы" value={metricForm.spend} onChange={e => setMetricForm(f => ({ ...f, spend: e.target.value }))} />
            <button className="btn-primary" type="submit">Сохранить</button>
          </form>
        )}
        {metrics && metrics.length > 0 ? (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 text-xs"><th className="pb-1">Дата</th><th>Показы</th><th>Клики</th><th>CTR%</th><th>Конверсии</th><th>Расходы</th></tr></thead>
            <tbody>
              {metrics.map(m => (
                <tr key={m.id} className="text-gray-300 border-t border-dark-border">
                  <td className="py-1">{m.date}</td>
                  <td>{m.impressions.toLocaleString()}</td>
                  <td>{m.clicks.toLocaleString()}</td>
                  <td>{m.ctr.toFixed(2)}%</td>
                  <td>{m.conversions}</td>
                  <td>{m.spend.toLocaleString()} ₽</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="text-xs text-gray-600">Метрик нет.</p>}
      </section>

      {/* Reports */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Отчёты</h2>
          <button className="btn-primary text-xs py-1 px-3" onClick={() => setShowReportForm(s => !s)}>+ Создать</button>
        </div>
        {showReportForm && (
          <form onSubmit={generateReport} className="flex gap-2 flex-wrap">
            <select className="input" value={reportForm.period} onChange={e => setReportForm(f => ({ ...f, period: e.target.value }))}>
              <option value="daily">Ежедневный</option>
              <option value="weekly">Еженедельный</option>
              <option value="monthly">Ежемесячный</option>
            </select>
            <input className="input" type="date" placeholder="Начало" value={reportForm.period_start} onChange={e => setReportForm(f => ({ ...f, period_start: e.target.value }))} required />
            <input className="input" type="date" placeholder="Конец" value={reportForm.period_end} onChange={e => setReportForm(f => ({ ...f, period_end: e.target.value }))} required />
            <button className="btn-primary" type="submit">Создать</button>
          </form>
        )}
        {reports && reports.length > 0 ? (
          <div className="space-y-2">
            {reports.map(r => (
              <div key={r.id} className="bg-dark-hover rounded-xl p-3 border border-dark-border text-sm">
                <div className="flex justify-between text-white font-medium">
                  <span>{r.period_start} → {r.period_end}</span>
                  <span className="text-xs text-gray-500">{r.period}</span>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2 text-xs text-gray-400">
                  <span>Показы: <strong className="text-white">{r.total_impressions.toLocaleString()}</strong></span>
                  <span>Клики: <strong className="text-white">{r.total_clicks.toLocaleString()}</strong></span>
                  <span>CTR: <strong className="text-white">{r.avg_ctr.toFixed(2)}%</strong></span>
                  <span>Расходы: <strong className="text-white">{r.total_spend.toLocaleString()} ₽</strong></span>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-gray-600">Отчётов нет.</p>}
      </section>

      {/* A/B Variants */}
      <section className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">A/B Тестирование</h2>
          <button className="btn-primary text-xs py-1 px-3" onClick={() => setShowVariantForm(s => !s)}>+ Вариант</button>
        </div>
        {showVariantForm && (
          <form onSubmit={addVariant} className="flex gap-2 flex-wrap">
            <input className="input" placeholder="Название варианта" value={variantForm.name} onChange={e => setVariantForm(f => ({ ...f, name: e.target.value }))} required />
            <input className="input" placeholder="Описание" value={variantForm.description} onChange={e => setVariantForm(f => ({ ...f, description: e.target.value }))} />
            <input className="input" placeholder="URL материала" value={variantForm.material_url} onChange={e => setVariantForm(f => ({ ...f, material_url: e.target.value }))} />
            <button className="btn-primary" type="submit">Добавить</button>
          </form>
        )}
        {variants && variants.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {variants.map(v => (
              <div key={v.id} className={`bg-dark-hover rounded-xl p-3 border ${v.is_winner ? 'border-accent-green' : 'border-dark-border'}`}>
                <div className="flex justify-between items-start">
                  <p className="text-white font-medium text-sm">{v.name}</p>
                  {v.is_winner && <span className="text-xs text-accent-green font-bold">🏆 Победитель</span>}
                </div>
                <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                  <div>Показы: <strong className="text-white">{v.impressions.toLocaleString()}</strong></div>
                  <div>Конверсии: <strong className="text-white">{v.conversions}</strong></div>
                  <div>CR: <strong className="text-white">{v.conversion_rate.toFixed(2)}%</strong></div>
                </div>
                {!v.is_winner && (
                  <button className="mt-2 text-xs text-accent-green hover:underline" onClick={() => declareWinner(v.id)}>Объявить победителем</button>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-gray-600">Вариантов нет.</p>}
      </section>
    </div>
  );
}
