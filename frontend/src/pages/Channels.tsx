import React, { useState } from 'react';
import { MediaChannel, ChannelType } from '../types';
import { campaignsService } from '../services/campaignsService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CHANNEL_LABELS: Record<ChannelType, string> = {
  social_media: 'Соцсети', search: 'Поиск', display: 'Медийная', video: 'Видео', email: 'Email', outdoor: 'Наружная',
};

const emptyForm = { name: '', channel_type: 'social_media' as ChannelType, description: '' };

export function Channels({ addToast }: Props) {
  const { data: channels, loading, refetch } = useFetch<MediaChannel[]>(() => campaignsService.listChannels());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await campaignsService.createChannel({ name: form.name, channel_type: form.channel_type, description: form.description || undefined });
      addToast('Канал создан', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch { addToast('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await campaignsService.removeChannel(id);
      addToast('Канал удалён', 'success');
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Медиаканалы</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Отмена' : '+ Новый канал'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Название *</label>
              <input className="input w-full" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Тип</label>
              <select className="input w-full" value={form.channel_type} onChange={e => setForm(f => ({ ...f, channel_type: e.target.value as ChannelType }))}>
                {(Object.keys(CHANNEL_LABELS) as ChannelType[]).map(t => (
                  <option key={t} value={t}>{CHANNEL_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Описание</label>
              <input className="input w-full" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
        </form>
      )}

      {loading ? <p className="text-gray-500 text-sm mt-4">Загрузка...</p> : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {channels?.map(ch => (
            <div key={ch.id} className="card flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{ch.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{CHANNEL_LABELS[ch.channel_type]}</p>
                {ch.description && <p className="text-xs text-gray-600 mt-0.5">{ch.description}</p>}
              </div>
              <button className="text-xs text-red-400 hover:text-red-300" onClick={() => handleDelete(ch.id)}>Удалить</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
