import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Campaign, CampaignStatus } from '../types';
import { campaignsService } from '../services/campaignsService';
import { useFetch } from '../hooks/useFetch';
import { DatePickerField } from '../components/DatePickerField';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: 'Черновик', active: 'Активна', paused: 'Пауза', completed: 'Завершена', cancelled: 'Отменена',
};
const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-gray-700 text-gray-300',
  active: 'bg-green-900 text-green-300',
  paused: 'bg-yellow-900 text-yellow-300',
  completed: 'bg-blue-900 text-blue-300',
  cancelled: 'bg-red-900 text-red-300',
};

const emptyForm = { order_id: '', name: '', description: '', budget: '', start_date: '', end_date: '' };

export function Campaigns({ addToast }: Props) {
  const { data: campaigns, loading, refetch } = useFetch<Campaign[]>(() => campaignsService.list());
  const { data: channels } = useFetch(() => campaignsService.listChannels());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.order_id || !form.name) { addToast('Заполните обязательные поля', 'error'); return; }
    setSaving(true);
    try {
      await campaignsService.create({
        order_id: parseInt(form.order_id),
        name: form.name,
        description: form.description || undefined,
        budget: parseFloat(form.budget) || 0,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      });
      addToast('Кампания создана', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch {
      addToast('Ошибка при создании', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Кампании</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Отмена' : '+ Новая кампания'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <h2 className="text-sm font-semibold text-white">Новая кампания</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ID заказа *</label>
              <input className="input w-full" type="number" value={form.order_id} onChange={e => set('order_id', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Название *</label>
              <input className="input w-full" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Бюджет</label>
              <input className="input w-full" type="number" step="0.01" value={form.budget} onChange={e => set('budget', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Описание</label>
              <input className="input w-full" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Дата начала</label>
              <DatePickerField value={form.start_date} onChange={v => set('start_date', v)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Дата окончания</label>
              <DatePickerField value={form.end_date} onChange={v => set('end_date', v)} />
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 text-sm mt-4">Загрузка...</p>
      ) : !campaigns?.length ? (
        <p className="text-gray-500 text-sm mt-4">Кампаний пока нет.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {campaigns.map(c => (
            <Link key={c.id} to={`/campaigns/${c.id}`} className="card flex items-center justify-between hover:border-accent-green/40 transition-all">
              <div>
                <p className="text-white font-medium">{c.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">Заказ #{c.order_id} · Бюджет: {c.budget.toLocaleString()} ₽</p>
                {c.media_channels.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {c.media_channels.map(ch => (
                      <span key={ch.id} className="text-xs bg-dark-hover border border-dark-border rounded-full px-2 py-0.5 text-gray-400">{ch.name}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                {c.start_date && <span className="text-xs text-gray-600">{c.start_date} → {c.end_date || '...'}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
