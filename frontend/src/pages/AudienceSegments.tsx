import React, { useState } from 'react';
import { AudienceSegment, Gender, IncomeLevel } from '../types';
import { audienceService } from '../services/audienceService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const GENDER_LABELS: Record<Gender, string> = { male: 'Мужчины', female: 'Женщины', all: 'Все' };
const INCOME_LABELS: Record<IncomeLevel, string> = { low: 'Низкий', medium: 'Средний', high: 'Высокий', ultra_high: 'Премиум' };

const emptyForm = { name: '', age_min: '', age_max: '', gender: 'all' as Gender, interests: '', geography: '', income_level: '' };

export function AudienceSegments({ addToast }: Props) {
  const { data: segments, loading, refetch } = useFetch<AudienceSegment[]>(() => audienceService.list());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await audienceService.create({
        name: form.name,
        age_min: form.age_min ? parseInt(form.age_min) : undefined,
        age_max: form.age_max ? parseInt(form.age_max) : undefined,
        gender: form.gender,
        interests: form.interests || undefined,
        geography: form.geography || undefined,
        income_level: (form.income_level as IncomeLevel) || undefined,
      });
      addToast('Сегмент создан', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Ошибка', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await audienceService.remove(id);
      addToast('Сегмент удалён', 'success');
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Аудитория</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Отмена' : '+ Новый сегмент'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-3">
              <label className="block text-xs text-gray-500 mb-1">Название *</label>
              <input className="input w-full" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Возраст от</label>
              <input className="input w-full" type="number" value={form.age_min} onChange={e => set('age_min', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Возраст до</label>
              <input className="input w-full" type="number" value={form.age_max} onChange={e => set('age_max', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Пол</label>
              <select className="input w-full" value={form.gender} onChange={e => set('gender', e.target.value)}>
                {(Object.keys(GENDER_LABELS) as Gender[]).map(g => <option key={g} value={g}>{GENDER_LABELS[g]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Интересы</label>
              <input className="input w-full" placeholder="через запятую" value={form.interests} onChange={e => set('interests', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Регион</label>
              <input className="input w-full" value={form.geography} onChange={e => set('geography', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Доход</label>
              <select className="input w-full" value={form.income_level} onChange={e => set('income_level', e.target.value)}>
                <option value="">— не указан —</option>
                {(Object.keys(INCOME_LABELS) as IncomeLevel[]).map(il => <option key={il} value={il}>{INCOME_LABELS[il]}</option>)}
              </select>
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
        </form>
      )}

      {loading ? <p className="text-gray-500 text-sm mt-4">Загрузка...</p> : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {segments?.map(s => (
            <div key={s.id} className="card">
              <div className="flex justify-between items-start">
                <p className="text-white font-medium">{s.name}</p>
                <button className="text-xs text-red-400 hover:text-red-300" onClick={() => handleDelete(s.id)}>Удалить</button>
              </div>
              <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                {(s.age_min || s.age_max) && <div>Возраст: {s.age_min ?? '?'} – {s.age_max ?? '?'} лет</div>}
                <div>Пол: {GENDER_LABELS[s.gender]}</div>
                {s.geography && <div>Регион: {s.geography}</div>}
                {s.income_level && <div>Доход: {INCOME_LABELS[s.income_level]}</div>}
                {s.interests && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {s.interests.split(',').map(i => i.trim()).filter(Boolean).map(i => (
                      <span key={i} className="bg-dark-hover border border-dark-border rounded-full px-2 py-0.5">{i}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
