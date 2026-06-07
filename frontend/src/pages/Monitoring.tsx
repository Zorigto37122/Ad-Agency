import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { MonitoringData } from '../types';
import api from '../services/api';

type Period = 'day' | 'week' | 'month' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  day: 'День',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
};

function BarChart({ data, color }: { data: number[]; color: string }) {
  const h = 120;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end justify-around gap-0.5 w-full" style={{ height: h }}>
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm min-w-0 transition-all"
          style={{ height: `${Math.max(2, (v / max) * h)}px`, background: color, opacity: v === 0 ? 0.15 : 0.85 }}
          title={String(v)}
        />
      ))}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card flex flex-col gap-2">
      <span className="section-title">{label}</span>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-600">{sub}</p>
    </div>
  );
}

export function Monitoring() {
  const [period, setPeriod] = useState<Period>('month');

  const { data, loading, error } = useFetch<MonitoringData>(
    () => api.get(`/api/monitoring?period=${period}`).then((r) => r.data),
    [period]
  );

  const firstDate = data?.orders_by_day[0]?.date.slice(5) ?? '';
  const lastDate = data?.orders_by_day.slice(-1)[0]?.date.slice(5) ?? '';

  return (
    <div className="page-content">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Мониторинг</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Период:</span>
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                p === period
                  ? 'bg-accent-green text-black'
                  : 'bg-dark-card border border-dark-border text-gray-500 hover:text-gray-300'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Status banner */}
      <div className="card flex items-center gap-4 border-l-2 border-l-accent-green">
        <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Все системы работают в штатном режиме</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {loading ? 'Загрузка…' : error ? 'Ошибка загрузки данных' : 'Данные актуальны'}
          </p>
        </div>
        <span className={`ml-auto badge ${error ? 'badge-orange' : 'badge-green'}`}>
          {error ? 'Ошибка' : 'Онлайн'}
        </span>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card h-28 animate-pulse bg-dark-hover" />
          ))}
        </div>
      ) : data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Новых заказов"
            value={String(data.summary.new_orders_in_period)}
            sub={`За ${PERIOD_LABELS[period].toLowerCase()}`}
            color="#7DC832"
          />
          <StatCard
            label="Выручка"
            value={`${data.summary.total_revenue.toLocaleString('ru-RU')} ₽`}
            sub="Выполненные заказы"
            color="#7DC832"
          />
          <StatCard
            label="Просрочено"
            value={String(data.summary.overdue_orders)}
            sub="Всего просроченных"
            color={data.summary.overdue_orders > 0 ? '#FF9300' : '#7DC832'}
          />
          <StatCard
            label="Активных"
            value={String(data.summary.active_orders)}
            sub="В работе сейчас"
            color="#7DC832"
          />
        </div>
      ) : null}

      {/* Charts */}
      {data && (
        <div className="grid grid-cols-2 gap-5">
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="section-title">Активность заказов</span>
              <span className="text-xs text-gray-600">{firstDate} — {lastDate}</span>
            </div>
            <BarChart data={data.orders_by_day.map((d) => d.count)} color="#7DC832" />
            <div className="flex justify-between text-[10px] text-gray-700">
              <span>{firstDate}</span>
              <span>{lastDate}</span>
            </div>
          </div>

          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="section-title">Выручка</span>
              <span className="text-xs text-gray-600">{firstDate} — {lastDate}</span>
            </div>
            <BarChart data={data.orders_by_day.map((d) => d.revenue)} color="#FF9300" />
            <div className="flex justify-between text-[10px] text-gray-700">
              <span>{firstDate}</span>
              <span>{lastDate}</span>
            </div>
          </div>
        </div>
      )}

      {/* Orders by service */}
      {data && data.orders_by_service.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="section-title">Заказы по типу услуг</span>
            <span className="text-xs text-gray-600">Всего заказов</span>
          </div>
          <div className="space-y-3">
            {data.orders_by_service.map((s) => {
              const serviceLabels: Record<string, string> = {
                web_design: 'Веб-дизайн',
                graphic_design: 'Графический дизайн',
                social_media_campaign: 'SMM-кампания',
                video_production: 'Видеопроизводство',
                copywriting: 'Копирайтинг',
              };
              const maxCount = Math.max(...data.orders_by_service.map((x) => x.count), 1);
              return (
                <div key={s.service_type} className="flex items-center gap-3 py-1.5 border-b border-dark-border last:border-0">
                  <span className="text-sm text-white w-44 flex-shrink-0">
                    {serviceLabels[s.service_type] ?? s.service_type}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-dark-border overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-accent-green"
                      style={{ width: `${(s.count / maxCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white w-6 text-right">{s.count}</span>
                  <span className="text-xs text-gray-600 w-24 text-right">
                    {s.revenue.toLocaleString('ru-RU')} ₽
                  </span>
                  {s.overdue > 0 && (
                    <span className="badge badge-orange text-xs">{s.overdue} просроч.</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Service health */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="section-title">Состояние сервисов</span>
          <span className="text-xs text-gray-600">
            {loading ? 'Проверка…' : 'Обновлено только что'}
          </span>
        </div>
        <div className="space-y-3">
          {[
            {
              name: 'API сервер',
              status: error ? 'degraded' : 'online',
              note: error ? 'Ошибка ответа' : 'Отвечает',
            },
            {
              name: 'База данных',
              status: error ? 'degraded' : 'online',
              note: error ? 'Недоступна' : 'Подключена',
            },
            { name: 'Celery Worker', status: 'unknown', note: 'Нет данных' },
            { name: 'Email-рассылка', status: 'unknown', note: 'Не настроена' },
          ].map((s) => (
            <div
              key={s.name}
              className="flex items-center justify-between py-2 border-b border-dark-border last:border-0"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    s.status === 'online'
                      ? 'bg-accent-green'
                      : s.status === 'degraded'
                      ? 'bg-accent-orange'
                      : 'bg-gray-600'
                  }`}
                />
                <span className="text-sm text-white">{s.name}</span>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <span className="text-gray-600">{s.note}</span>
                <span
                  className={`badge ${
                    s.status === 'online'
                      ? 'badge-green'
                      : s.status === 'degraded'
                      ? 'badge-orange'
                      : 'badge-gray'
                  }`}
                >
                  {s.status === 'online'
                    ? 'Работает'
                    : s.status === 'degraded'
                    ? 'Снижение'
                    : 'Неизвестно'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Monitoring;
