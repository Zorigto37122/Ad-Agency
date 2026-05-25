import React, { useState } from 'react';
import { AdPlacement, PlacementStatus } from '../types';
import { placementsService } from '../services/placementsService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const STATUS_LABELS: Record<PlacementStatus, string> = {
  scheduled: 'Запланировано', live: 'В эфире', completed: 'Завершено', cancelled: 'Отменено',
};
const STATUS_COLORS: Record<PlacementStatus, string> = {
  scheduled: 'bg-blue-900 text-blue-300',
  live: 'bg-green-900 text-green-300',
  completed: 'bg-gray-700 text-gray-300',
  cancelled: 'bg-red-900 text-red-300',
};

const emptyForm = { campaign_id: '', channel_id: '', scheduled_at: '', duration_seconds: '', position: '', cost_per_slot: '', notes: '' };

export function Placements({ addToast }: Props) {
  const { data: placements, loading, refetch } = useFetch<AdPlacement[]>(() => placementsService.listPlacements());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await placementsService.createPlacement({
        campaign_id: parseInt(form.campaign_id),
        channel_id: parseInt(form.channel_id),
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : undefined,
        position: form.position || undefined,
        cost_per_slot: parseFloat(form.cost_per_slot) || 0,
        notes: form.notes || undefined,
      });
      addToast('Размещение создано', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch { addToast('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const changeStatus = async (id: number, status: PlacementStatus) => {
    try {
      await placementsService.updatePlacement(id, { status });
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Размещения</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Отмена' : '+ Новое размещение'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">ID кампании *</label><input className="input w-full" type="number" value={form.campaign_id} onChange={e => set('campaign_id', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-500 mb-1">ID канала *</label><input className="input w-full" type="number" value={form.channel_id} onChange={e => set('channel_id', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Дата/время *</label><input className="input w-full" type="datetime-local" value={form.scheduled_at} onChange={e => set('scheduled_at', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Длительность (сек)</label><input className="input w-full" type="number" value={form.duration_seconds} onChange={e => set('duration_seconds', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Позиция</label><input className="input w-full" placeholder="top_banner" value={form.position} onChange={e => set('position', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Стоимость</label><input className="input w-full" type="number" step="0.01" value={form.cost_per_slot} onChange={e => set('cost_per_slot', e.target.value)} /></div>
            <div className="col-span-3"><label className="block text-xs text-gray-500 mb-1">Заметки</label><input className="input w-full" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
        </form>
      )}

      {loading ? <p className="text-gray-500 text-sm mt-4">Загрузка...</p> : !placements?.length ? (
        <p className="text-gray-500 text-sm mt-4">Размещений нет.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {placements.map(p => (
            <div key={p.id} className="card flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Кампания #{p.campaign_id} · Канал #{p.channel_id}</p>
                <p className="text-xs text-gray-500 mt-0.5">{new Date(p.scheduled_at).toLocaleString('ru')}</p>
                <div className="flex gap-3 text-xs text-gray-600 mt-0.5">
                  {p.position && <span>Позиция: {p.position}</span>}
                  {p.duration_seconds && <span>{p.duration_seconds} сек</span>}
                  <span>{p.cost_per_slot.toLocaleString()} ₽</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                <select className="input text-xs py-0.5" value={p.status} onChange={e => changeStatus(p.id, e.target.value as PlacementStatus)}>
                  {(Object.keys(STATUS_LABELS) as PlacementStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
