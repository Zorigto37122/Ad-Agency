import React, { useCallback, useState } from 'react';
import { DiscountProgram } from '../types';
import { discountsService } from '../services/discountsService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error') => void;
}

const emptyForm = { name: '', min_completed_orders: '', discount_percent: '' };

export function Discounts({ addToast }: Props) {
  const fetch = useCallback(() => discountsService.list(), []);
  const { data: fetched, loading, refetch } = useFetch<DiscountProgram[]>(fetch, []);
  const [programs, setPrograms] = useState<DiscountProgram[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (fetched) setPrograms(fetched);
  }, [fetched]);

  const resetForm = () => { setForm(emptyForm); setEditId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      min_completed_orders: parseInt(form.min_completed_orders, 10),
      discount_percent: parseFloat(form.discount_percent),
      is_active: true,
    };
    setSaving(true);
    try {
      if (editId !== null) {
        const updated = await discountsService.update(editId, payload);
        setPrograms((prev) => prev.map((p) => (p.id === editId ? updated : p)));
        addToast('Программа обновлена', 'success');
      } else {
        const created = await discountsService.create(payload);
        setPrograms((prev) => [...prev, created].sort((a, b) => a.min_completed_orders - b.min_completed_orders));
        addToast('Программа создана', 'success');
      }
      resetForm();
    } catch {
      addToast('Ошибка при сохранении', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: DiscountProgram) => {
    setEditId(p.id);
    setForm({
      name: p.name,
      min_completed_orders: String(p.min_completed_orders),
      discount_percent: String(p.discount_percent),
    });
  };

  const handleToggle = async (p: DiscountProgram) => {
    try {
      const updated = await discountsService.update(p.id, { is_active: !p.is_active });
      setPrograms((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
    } catch {
      addToast('Ошибка при изменении статуса', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await discountsService.remove(id);
      setPrograms((prev) => prev.filter((p) => p.id !== id));
      addToast('Программа удалена', 'success');
    } catch {
      addToast('Ошибка при удалении', 'error');
    }
  };

  return (
    <div className="page-content max-w-3xl">
      <h1 className="page-title">Программы скидок</h1>

      {/* Info banner */}
      <div className="card bg-accent-green/5 border-accent-green/20 flex gap-3 items-start">
        <svg className="w-5 h-5 text-accent-green flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-gray-400">
          Скидки применяются автоматически при создании нового заказа. Система выбирает лучшую подходящую программу
          на основе количества <strong className="text-white">завершённых</strong> заказов клиента.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-4">
        <h2 className="section-title">{editId !== null ? 'Редактировать программу' : 'Новая программа'}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Название</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Напр. «Постоянный клиент»"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Мин. заказов</label>
            <input
              type="number"
              min={1}
              value={form.min_completed_orders}
              onChange={(e) => setForm({ ...form, min_completed_orders: e.target.value })}
              placeholder="Напр. 5"
              className="input w-full"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Скидка (%)</label>
            <input
              type="number"
              min={0.1}
              max={100}
              step={0.1}
              value={form.discount_percent}
              onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
              placeholder="Напр. 10"
              className="input w-full"
              required
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {editId !== null && (
            <button type="button" onClick={resetForm} className="btn-secondary text-sm">
              Отмена
            </button>
          )}
          <button type="submit" disabled={saving} className="btn-primary text-sm">
            {saving ? 'Сохранение...' : editId !== null ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : programs.length === 0 ? (
          <p className="py-12 text-center text-gray-600 text-sm">Нет программ скидок</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-dark-border">
              <tr>
                {['Название', 'Мин. заказов', 'Скидка', 'Статус', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {programs.map((p, i) => (
                <tr
                  key={p.id}
                  className={`hover:bg-dark-hover transition-colors ${i < programs.length - 1 ? 'border-b border-dark-border' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400">от {p.min_completed_orders} зак.</td>
                  <td className="px-4 py-3 font-semibold text-accent-green">{p.discount_percent}%</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(p)}
                      className={`badge text-xs cursor-pointer hover:opacity-80 transition-opacity ${p.is_active ? 'badge-green' : 'badge-gray'}`}
                    >
                      {p.is_active ? 'Активна' : 'Отключена'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(p)}
                        className="text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Discounts;
