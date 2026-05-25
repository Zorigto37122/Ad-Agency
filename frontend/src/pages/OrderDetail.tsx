import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ordersService } from '../services/ordersService';
import { useFetch } from '../hooks/useFetch';
import { Order } from '../types';
import { statusLabels, SERVICE_LABELS } from './Orders';
import { authService } from '../services/authService';

const statusBadge: Record<string, string> = {
  pending: 'badge-orange',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'badge-green',
  cancelled: 'badge-gray',
  overdue: 'badge-red',
};

const scopeLabels: Record<string, string> = {
  small: 'Маленький',
  medium: 'Средний',
  large: 'Большой',
};

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function OrderDetail({ addToast }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [deletingFile, setDeletingFile] = useState(false);

  const { data: order, loading, refetch } = useFetch<Order>(
    () => ordersService.get(Number(id)),
    [id]
  );

  const handleDownload = async () => {
    if (!order?.attachment_filename) return;
    setDownloading(true);
    try {
      await ordersService.downloadAttachment(order.id, order.attachment_filename);
    } catch {
      addToast('Не удалось скачать файл', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!order) return;
    setDeletingFile(true);
    try {
      await ordersService.deleteAttachment(order.id);
      addToast('Файл удалён', 'success');
      refetch();
    } catch {
      addToast('Не удалось удалить файл', 'error');
    } finally {
      setDeletingFile(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="page-content text-gray-600">Заказ не найден.</div>
  );

  return (
    <div className="page-content max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/orders" className="text-gray-600 hover:text-accent-green transition-colors">← Заказы</Link>
        <span className="text-gray-700">/</span>
        <span className="text-white font-medium">{order.title}</span>
      </div>

      <div className="card space-y-5">
        {/* Status + price */}
        <div className="flex items-start justify-between">
          <div>
            <p className="section-title mb-1">Статус</p>
            <span className={`badge text-xs ${statusBadge[order.status]}`}>{statusLabels[order.status]}</span>
          </div>
          <div className="text-right">
            <p className="section-title mb-1">Стоимость</p>
            <p className="text-3xl font-black text-white">{order.final_price.toLocaleString('ru-RU')} ₽</p>
            {order.discount_percent > 0 && (
              <p className="text-xs text-accent-green mt-0.5">
                Скидка {order.discount_percent}%
                {order.discount_name && <span className="text-gray-500"> · {order.discount_name}</span>}
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-dark-border" />

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="section-title mb-1">Клиент</p>
            <Link to={`/clients/${order.client_id}`} className="text-accent-green hover:brightness-110 font-medium transition-colors">
              {order.client.name}
            </Link>
            {order.client.company && <p className="text-gray-600 text-xs mt-0.5">{order.client.company}</p>}
          </div>
          <div>
            <p className="section-title mb-1">Услуга</p>
            <p className="font-medium text-white">{SERVICE_LABELS[order.service_type]}</p>
          </div>
          <div>
            <p className="section-title mb-1">Объём</p>
            <p className="font-medium text-white">{scopeLabels[order.scope]}</p>
          </div>
          <div>
            <p className="section-title mb-1">Срок</p>
            <p className="font-medium text-white">
              {order.deadline ? new Date(order.deadline).toLocaleDateString('ru-RU') : '—'}
            </p>
          </div>
          <div>
            <p className="section-title mb-1">Создан</p>
            <p className="font-medium text-white">{new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
          </div>
          {order.updated_at && (
            <div>
              <p className="section-title mb-1">Обновлён</p>
              <p className="font-medium text-white">{new Date(order.updated_at).toLocaleDateString('ru-RU')}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {order.description && (
          <>
            <div className="h-px bg-dark-border" />
            <div>
              <p className="section-title mb-2">Описание</p>
              <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{order.description}</p>
            </div>
          </>
        )}

        {/* Attachment */}
        <>
          <div className="h-px bg-dark-border" />
          <div>
            <p className="section-title mb-3">Файл с требованиями</p>
            {order.attachment_filename ? (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-hover border border-dark-border">
                <svg className="w-5 h-5 text-accent-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-white flex-1 truncate">{order.attachment_filename}</span>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  {downloading ? (
                    <span className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  Скачать
                </button>
                <button
                  onClick={handleDeleteFile}
                  disabled={deletingFile}
                  title="Удалить файл"
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-dark-border">
                <svg className="w-4 h-4 text-gray-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm text-gray-600">Файл не прикреплён</span>
                <Link to={`/orders/${order.id}/edit`} className="ml-auto text-xs text-accent-green/70 hover:text-accent-green transition-colors">
                  Прикрепить →
                </Link>
              </div>
            )}
          </div>
        </>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link to={`/orders/${order.id}/edit`} className="btn-primary">Редактировать</Link>
          <button className="btn-secondary" onClick={() => navigate('/orders')}>Назад к списку</button>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
