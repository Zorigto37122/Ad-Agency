import React, { useState } from 'react';
import { Vendor } from '../types';
import { crmService } from '../services/crmService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const emptyForm = { name: '', email: '', phone: '', specialty: '', rating: '', notes: '' };

function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-gray-600 text-xs">Без оценки</span>;
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span className="text-gray-500 text-xs ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

export function Vendors({ addToast }: Props) {
  const { data: vendors, loading, refetch } = useFetch<Vendor[]>(() => crmService.listVendors());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await crmService.createVendor({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        specialty: form.specialty || undefined,
        rating: form.rating ? parseFloat(form.rating) : undefined,
        notes: form.notes || undefined,
      });
      addToast('Подрядчик добавлен', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch { addToast('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    try {
      await crmService.removeVendor(id);
      addToast('Подрядчик удалён', 'success');
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Подрядчики</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Отмена' : '+ Новый подрядчик'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Название *</label><input className="input w-full" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Email</label><input className="input w-full" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Телефон</label><input className="input w-full" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Специализация</label><input className="input w-full" value={form.specialty} onChange={e => set('specialty', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Рейтинг (1–5)</label><input className="input w-full" type="number" min="1" max="5" step="0.1" value={form.rating} onChange={e => set('rating', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Заметки</label><input className="input w-full" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Добавить'}</button>
        </form>
      )}

      {loading ? <p className="text-gray-500 text-sm mt-4">Загрузка...</p> : !vendors?.length ? (
        <p className="text-gray-500 text-sm mt-4">Подрядчиков нет.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {vendors.map(v => (
            <div key={v.id} className="card">
              <div className="flex justify-between items-start">
                <p className="text-white font-medium">{v.name}</p>
                <button className="text-xs text-red-400 hover:text-red-300" onClick={() => handleDelete(v.id)}>Удалить</button>
              </div>
              <StarRating rating={v.rating} />
              {v.specialty && <p className="text-xs text-gray-500 mt-1">{v.specialty}</p>}
              <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                {v.email && <p>{v.email}</p>}
                {v.phone && <p>{v.phone}</p>}
                {v.notes && <p className="text-gray-700 mt-1">{v.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
