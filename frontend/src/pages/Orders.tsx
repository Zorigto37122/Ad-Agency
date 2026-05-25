import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Order, OrderStatus } from '../types';
import { ordersService } from '../services/ordersService';
import { useFetch } from '../hooks/useFetch';
import { ConfirmDialog } from '../components/ConfirmDialog';

const statusBadge: Record<OrderStatus, string> = {
  pending: 'badge-orange',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'badge-green',
  cancelled: 'badge-gray',
  overdue: 'badge-red',
};

export const statusLabels: Record<OrderStatus, string> = {
  pending: 'Ожидает',
  in_progress: 'В работе',
  done: 'Выполнен',
  cancelled: 'Отменён',
  overdue: 'Просрочен',
};

export const SERVICE_LABELS: Record<string, string> = {
  web_design: 'Веб-дизайн',
  graphic_design: 'Граф. дизайн',
  social_media_campaign: 'SMM',
  video_production: 'Видео',
  copywriting: 'Копирайтинг',
};

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function Orders({ addToast }: Props) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const limit = 10;

  const fetchOrders = useCallback(() =>
    ordersService.list({ status: statusFilter || undefined, search: search || undefined, skip: page * limit, limit }),
    [statusFilter, search, page]
  );

  const { data: orders, loading, refetch } = useFetch<Order[]>(fetchOrders, [statusFilter, search, page]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await ordersService.remove(deleteTarget.id);
      addToast('Заказ удалён', 'success');
      setDeleteTarget(null);
      refetch();
    } catch {
      addToast('Не удалось удалить заказ', 'error');
    }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Заказы</h1>
        <Link to="/orders/new" className="btn-primary">+ Новый заказ</Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="input pl-9 w-64"
            placeholder="Поиск по заказам или клиентам…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select
          className="input w-44"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | ''); setPage(0); }}
        >
          <option value="">Все статусы</option>
          {Object.entries(statusLabels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dark-border">
              <tr>
                {['#', 'Название', 'Клиент', 'Услуга', 'Статус', 'Цена', 'Срок', 'Действия'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-600">
                  <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : orders?.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-600">Заказы не найдены</td></tr>
              ) : orders?.map((o, i) => (
                <tr
                  key={o.id}
                  className={`hover:bg-dark-hover transition-colors ${i < (orders?.length ?? 0) - 1 ? 'border-b border-dark-border' : ''}`}
                >
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">#{o.id}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    <Link to={`/orders/${o.id}`} className="hover:text-accent-green transition-colors">{o.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    <Link to={`/clients/${o.client_id}`} className="hover:text-accent-green transition-colors">{o.client.name}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{SERVICE_LABELS[o.service_type]}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${statusBadge[o.status]}`}>{statusLabels[o.status]}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">
                    {o.final_price.toLocaleString('ru-RU')} ₽
                    {o.discount_percent > 0 && (
                      <span className="ml-1 text-xs text-accent-green">(-{o.discount_percent}%)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {o.deadline ? new Date(o.deadline).toLocaleDateString('ru-RU') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/orders/${o.id}/edit`} className="btn-secondary text-xs py-1 px-2">Изменить</Link>
                      <button className="btn-danger text-xs py-1 px-2" onClick={() => setDeleteTarget(o)}>Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center px-4 py-3 border-t border-dark-border">
          <button className="btn-secondary text-xs py-1.5" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Назад</button>
          <span className="text-xs text-gray-600">Страница {page + 1}</span>
          <button className="btn-secondary text-xs py-1.5" disabled={(orders?.length ?? 0) < limit} onClick={() => setPage(p => p + 1)}>Вперёд →</button>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Удалить заказ"
        message={`Удалить «${deleteTarget?.title}»? Это действие необратимо.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default Orders;
