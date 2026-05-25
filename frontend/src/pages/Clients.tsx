import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Client, ClientCreate } from '../types';
import { clientsService } from '../services/clientsService';
import { useFetch } from '../hooks/useFetch';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const emptyForm: ClientCreate = { name: '', email: '', phone: '', company: '', notes: '' };

export function Clients({ addToast }: Props) {
  const { data: clients, loading, refetch } = useFetch<Client[]>(() => clientsService.list());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ClientCreate>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clientsService.create(form);
      addToast('Клиент создан', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Не удалось создать клиента';
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await clientsService.remove(deleteTarget.id);
      addToast('Клиент удалён', 'success');
      setDeleteTarget(null);
      refetch();
    } catch {
      addToast('Не удалось удалить клиента', 'error');
    }
  };

  const set = (field: keyof ClientCreate, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Клиенты</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отмена' : '+ Новый клиент'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-4">
          <span className="section-title">Добавить нового клиента</span>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Имя *</label>
              <input className="input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Полное имя" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div>
              <label className="label">Телефон</label>
              <input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+7 999 000 00 00" />
            </div>
            <div>
              <label className="label">Компания</label>
              <input className="input" value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="ООО Компания" />
            </div>
          </div>
          <div>
            <label className="label">Примечания</label>
            <textarea className="input" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Сохранение…' : 'Создать клиента'}
          </button>
        </form>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dark-border">
              <tr>
                {['Имя', 'Email', 'Телефон', 'Компания', 'Заказы', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-600">
                  <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : clients?.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-600">Клиентов пока нет</td></tr>
              ) : clients?.map((c, i) => (
                <tr
                  key={c.id}
                  className={`hover:bg-dark-hover transition-colors ${i < (clients?.length ?? 0) - 1 ? 'border-b border-dark-border' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-white">
                    <Link to={`/clients/${c.id}`} className="hover:text-accent-green transition-colors">{c.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3 text-gray-500">{c.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.company || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="badge-green">{c.order_count}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/clients/${c.id}`} className="btn-secondary text-xs py-1 px-2">Просмотр</Link>
                      <button className="btn-danger text-xs py-1 px-2" onClick={() => setDeleteTarget(c)}>Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить клиента"
        message={`Удалить «${deleteTarget?.name}» и все его заказы? Это действие необратимо.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Clients;
