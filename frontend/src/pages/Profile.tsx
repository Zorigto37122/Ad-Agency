import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { User, Order, OrderStatus } from '../types';
import { ordersService } from '../services/ordersService';
import { useFetch } from '../hooks/useFetch';

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

interface Props { user: User; }

export function Profile({ user }: Props) {
  const fetchOrders = useCallback(() => ordersService.list({ limit: 50 }), []);
  const { data: orders, loading } = useFetch<Order[]>(fetchOrders, []);

  const stats = orders
    ? {
        total: orders.length,
        active: orders.filter((o) => o.status === 'in_progress').length,
        done: orders.filter((o) => o.status === 'done').length,
        revenue: orders.filter((o) => o.status === 'done').reduce((s, o) => s + o.final_price, 0),
      }
    : null;

  const initials = user.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="page-content max-w-5xl mx-auto">
      <h1 className="page-title">Личный кабинет</h1>

      {/* User card */}
      <div className="card flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-accent-green/20 border border-accent-green/30 flex items-center justify-center text-accent-green font-black text-lg flex-shrink-0">
          {initials}
        </div>
        <div>
          <p className="font-bold text-white text-lg">{user.full_name}</p>
          <p className="text-sm text-gray-600 mt-0.5">{user.email}</p>
          <span className="mt-1 inline-block badge badge-green text-xs">
            {user.is_admin ? 'Администратор' : 'Клиент'}
          </span>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Всего заказов', value: stats.total, color: 'text-white' },
            { label: 'В работе', value: stats.active, color: 'text-blue-400' },
            { label: 'Выполнено', value: stats.done, color: 'text-accent-green' },
            { label: 'Выручка', value: `${stats.revenue.toLocaleString('ru-RU')} ₽`, color: 'text-accent-orange' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card text-center py-4">
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs text-gray-600 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Orders table */}
      <div className="flex items-center justify-between">
        <span className="section-title">Мои заказы</span>
        <Link to="/orders/new" className="btn-primary text-xs py-1.5">+ Новый заказ</Link>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-dark-border">
              <tr>
                {['#', 'Название', 'Клиент', 'Статус', 'Цена', 'Срок'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center">
                  <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
                </td></tr>
              ) : orders?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    <p className="text-gray-600 mb-3">У вас пока нет заказов</p>
                    <Link to="/orders/new" className="btn-primary text-sm">Создать первый заказ</Link>
                  </td>
                </tr>
              ) : orders?.map((o, i) => (
                <tr
                  key={o.id}
                  className={`hover:bg-dark-hover transition-colors ${i < (orders?.length ?? 0) - 1 ? 'border-b border-dark-border' : ''}`}
                >
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">#{o.id}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    <Link to={`/orders/${o.id}`} className="hover:text-accent-green transition-colors">{o.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{o.client.name}</td>
                  <td className="px-4 py-3">
                    <span className={`badge text-xs ${statusBadge[o.status]}`}>{statusLabels[o.status]}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-white">{o.final_price.toLocaleString('ru-RU')} ₽</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {o.deadline ? new Date(o.deadline).toLocaleDateString('ru-RU') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Profile;
