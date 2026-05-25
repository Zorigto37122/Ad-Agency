import React, { useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { clientsService } from '../services/clientsService';
import { discountsService } from '../services/discountsService';
import { useFetch } from '../hooks/useFetch';
import { ClientDetail as ClientDetailType, OrderStatus, ClientUpdate, DiscountProgram } from '../types';
import { ConfirmDialog } from '../components/ConfirmDialog';

const statusBadge: Record<OrderStatus, string> = {
  pending: 'badge-orange',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'badge-green',
  cancelled: 'badge-gray',
  overdue: 'badge-red',
};

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  done: 'Выполнен',
  cancelled: 'Отменён',
  overdue: 'Просрочен',
};

const SERVICE_LABELS: Record<string, string> = {
  web_design: 'Веб-дизайн',
  graphic_design: 'Граф. дизайн',
  social_media_campaign: 'SMM',
  video_production: 'Видео',
  copywriting: 'Копирайтинг',
};

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function ClientDetail({ addToast }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<ClientUpdate>({});
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: client, loading, refetch } = useFetch<ClientDetailType>(
    () => clientsService.get(Number(id)),
    [id]
  );
  const fetchDiscounts = useCallback(() => discountsService.list(), []);
  const { data: discountPrograms } = useFetch<DiscountProgram[]>(fetchDiscounts, []);

  const completedCount = client?.orders.filter((o) => o.status === 'done').length ?? 0;
  const bestDiscount = discountPrograms
    ?.filter((p) => p.is_active && p.min_completed_orders <= completedCount)
    .sort((a, b) => b.min_completed_orders - a.min_completed_orders)[0] ?? null;
  const nextDiscount = discountPrograms
    ?.filter((p) => p.is_active && p.min_completed_orders > completedCount)
    .sort((a, b) => a.min_completed_orders - b.min_completed_orders)[0] ?? null;

  const startEdit = () => {
    if (!client) return;
    setEditForm({ name: client.name, email: client.email, phone: client.phone || '', company: client.company || '', notes: client.notes || '' });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await clientsService.update(Number(id), editForm);
      addToast('Клиент обновлён', 'success');
      setEditing(false);
      refetch();
    } catch {
      addToast('Не удалось обновить клиента', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await clientsService.remove(Number(id));
      addToast('Клиент удалён', 'success');
      navigate('/clients');
    } catch {
      addToast('Не удалось удалить клиента', 'error');
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!client) return <div className="page-content text-gray-600">Клиент не найден</div>;

  const initials = client.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page-content max-w-5xl mx-auto">
      <Link to="/clients" className="text-sm text-gray-600 hover:text-accent-green transition-colors">← Клиенты</Link>

      {/* Client card */}
      <div className="card">
        <div className="flex items-start justify-between">
          {editing ? (
            <form onSubmit={handleSave} className="flex-1 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Имя</label>
                  <input className="input" value={editForm.name || ''} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={editForm.email || ''} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Телефон</label>
                  <input className="input" value={editForm.phone || ''} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Компания</label>
                  <input className="input" value={editForm.company || ''} onChange={(e) => setEditForm(f => ({ ...f, company: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Примечания</label>
                <textarea className="input" rows={2} value={editForm.notes || ''} onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary">Сохранить</button>
                <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Отмена</button>
              </div>
            </form>
          ) : (
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-xl bg-accent-green/20 border border-accent-green/30 flex items-center justify-center text-accent-green font-black flex-shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{client.name}</h1>
                {client.company && <p className="text-gray-500 mt-0.5 text-sm">{client.company}</p>}
                <div className="mt-3 space-y-1 text-sm text-gray-500">
                  <p><span className="text-gray-600">Email:</span> {client.email}</p>
                  {client.phone && <p><span className="text-gray-600">Телефон:</span> {client.phone}</p>}
                  {client.notes && <p className="mt-2 italic text-gray-600">{client.notes}</p>}
                </div>
              </div>
              {/* Discount level */}
              {discountPrograms && (
                <div className="mt-4 pt-4 border-t border-dark-border flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 14L15 8M9 9h.01M15 15h.01M19 5H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2z" />
                    </svg>
                    <span className="text-xs text-gray-500">Завершено заказов: <span className="text-white font-semibold">{completedCount}</span></span>
                  </div>
                  {bestDiscount ? (
                    <span className="badge badge-green text-xs">Скидка {bestDiscount.discount_percent}% · {bestDiscount.name}</span>
                  ) : (
                    <span className="text-xs text-gray-700">Скидка не применяется</span>
                  )}
                  {nextDiscount && (
                    <span className="text-xs text-gray-600">
                      До скидки {nextDiscount.discount_percent}% осталось {nextDiscount.min_completed_orders - completedCount} зак.
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          {!editing && (
            <div className="flex gap-2 ml-4 flex-shrink-0">
              <button className="btn-secondary" onClick={startEdit}>Изменить</button>
              <button className="btn-danger" onClick={() => setShowDelete(true)}>Удалить</button>
            </div>
          )}
        </div>
      </div>

      {/* Orders */}
      <div className="flex items-center justify-between">
        <span className="section-title">История заказов ({client.order_count})</span>
        <Link to="/orders/new" className="btn-primary text-xs py-1.5">+ Новый заказ</Link>
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-dark-border">
            <tr>
              {['Название', 'Услуга', 'Статус', 'Цена', 'Срок', 'Создан'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {client.orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-600">Заказов пока нет</td></tr>
            ) : client.orders.map((o, i) => (
              <tr
                key={o.id}
                className={`hover:bg-dark-hover transition-colors ${i < client.orders.length - 1 ? 'border-b border-dark-border' : ''}`}
              >
                <td className="px-4 py-3 font-medium text-white">{o.title}</td>
                <td className="px-4 py-3 text-gray-500">{SERVICE_LABELS[o.service_type]}</td>
                <td className="px-4 py-3"><span className={`badge text-xs ${statusBadge[o.status]}`}>{statusLabels[o.status]}</span></td>
                <td className="px-4 py-3 font-semibold text-white">{o.final_price.toLocaleString('ru-RU')} ₽</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{o.deadline ? new Date(o.deadline).toLocaleDateString('ru-RU') : '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{new Date(o.created_at).toLocaleDateString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Удалить клиента"
        message={`Удалить «${client.name}» и все его заказы? Это действие необратимо.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

export default ClientDetail;
