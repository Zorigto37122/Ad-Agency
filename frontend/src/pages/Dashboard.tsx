import React from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { DashboardStats, OrderStatus } from '../types';
import api from '../services/api';

const statusColors: Record<OrderStatus, string> = {
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

const DotsIcon = () => (
  <button className="text-gray-600 hover:text-gray-400 transition-colors">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
    </svg>
  </button>
);

function MiniLineChart({ color }: { color: string }) {
  const pts = [18, 14, 16, 10, 15, 9, 12];
  const w = 80, h = 28;
  const min = Math.min(...pts), max = Math.max(...pts);
  const sx = (i: number) => (i / (pts.length - 1)) * w;
  const sy = (v: number) => h - ((v - min) / (max - min + 1)) * h;
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${sx(i)} ${sy(v)}`).join(' ');
  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={pts.map((v, i) => `${sx(i)},${sy(v)}`).join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotMatrix({ greenCount, orangeCount, total }: { greenCount: number; orangeCount: number; total: number }) {
  const cols = 10;
  const rows = Math.ceil(total / cols);
  const dots = Array.from({ length: rows * cols }, (_, i) => {
    if (i < greenCount) return 'green';
    if (i < greenCount + orangeCount) return 'orange';
    return 'empty';
  });
  return (
    <div className="flex flex-wrap gap-1 mt-2" style={{ width: cols * 14 }}>
      {dots.map((t, i) => (
        <div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${
            t === 'green' ? 'bg-accent-green' : t === 'orange' ? 'bg-accent-orange' : 'bg-dark-border'
          }`}
        />
      ))}
    </div>
  );
}

function BubbleChart({ data }: { data: { label: string; top: number; bot: number; isGreen: boolean }[] }) {
  return (
    <div className="flex items-end justify-between gap-2 h-32 mt-4">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] text-gray-500">{d.top}</span>
          <div
            className={`w-8 rounded-full flex items-center justify-center text-[9px] font-bold text-black ${d.isGreen ? 'bg-accent-green' : 'bg-accent-orange'}`}
            style={{ height: Math.max(24, (d.top / 100) * 72) }}
          />
          <div className="w-2 h-2 rounded-full bg-white/30" />
          <div
            className={`w-8 rounded-full flex items-center justify-center text-[9px] font-bold text-black ${d.isGreen ? 'bg-accent-green/60' : 'bg-accent-orange/60'}`}
            style={{ height: Math.max(16, (d.bot / 100) * 48) }}
          />
          <span className="text-[10px] text-gray-500">{d.bot}</span>
          <span className="text-[10px] text-gray-600 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function TimelineRow({ label, start, width, color, value }: {
  label: string; start: number; width: number; color: string; value: number;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs text-gray-500 w-10 flex-shrink-0 text-right">{label}</span>
      <div className="flex-1 relative h-6 flex items-center">
        <div className="absolute inset-y-0 left-0 right-0 flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 border-r border-dark-border/40" />
          ))}
        </div>
        <div
          className={`absolute h-5 rounded-full flex items-center px-2 ${color}`}
          style={{ left: `${start}%`, width: `${width}%` }}
        >
          <span className="text-[10px] font-bold text-black ml-auto">{value}</span>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { data, loading, error } = useFetch<DashboardStats>(() =>
    api.get('/api/dashboard').then((r) => r.data)
  );

  if (loading) return (
    <div className="flex-1 flex items-center justify-center text-gray-600">
      <div className="text-center space-y-2">
        <div className="w-8 h-8 border-2 border-accent-green border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm">Загрузка…</p>
      </div>
    </div>
  );
  if (error) return <div className="page-content text-red-400">{error}</div>;
  if (!data) return null;

  const total = data.total_orders || 1;
  const doneRatio = Math.round((data.total_orders - data.pending_orders - data.active_orders - data.overdue_orders) / total * 100);
  const activeRatio = Math.round(data.active_orders / total * 100);

  const bubbleData = [
    { label: 'Веб', top: 52, bot: 81, isGreen: true },
    { label: 'SMM', top: 96, bot: 25, isGreen: false },
    { label: 'Граф', top: 48, bot: 51, isGreen: true },
    { label: 'Видео', top: 80, bot: 49, isGreen: true },
    { label: 'Copy', top: 34, bot: 67, isGreen: false },
    { label: 'Баннер', top: 92, bot: 28, isGreen: true },
    { label: 'PR', top: 84, bot: 20, isGreen: false },
    { label: 'SEO', top: 58, bot: 39, isGreen: true },
    { label: 'Email', top: 36, bot: 72, isGreen: false },
  ];

  const recentOrders = data.recent_orders.slice(0, 7);
  const timelineColors = ['bg-accent-green', 'bg-accent-orange', 'bg-blue-500', 'bg-accent-green', 'bg-purple-500', 'bg-accent-orange', 'bg-accent-green'];

  return (
    <div className="page-content">
      {/* Title + filter row */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Панель управления</h1>
        <div className="flex items-center gap-2">
          {[
            { label: 'Дата', value: 'Сейчас' },
            { label: 'Услуга', value: 'Все' },
            { label: 'Менеджер', value: 'Все' },
          ].map(({ label, value }) => (
            <button
              key={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-gray-300 hover:border-gray-600 transition-colors"
            >
              <span className="text-gray-600">{label}:</span>
              <span>{value}</span>
              <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          ))}
          <button className="w-8 h-8 rounded-lg bg-dark-card border border-dark-border flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left 2/3 */}
        <div className="col-span-2 space-y-5">
          {/* Two small metric cards */}
          <div className="grid grid-cols-2 gap-5">
            {/* КЛИЕНТ card */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="section-title">Клиент</span>
                <DotsIcon />
              </div>
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-accent-green" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                    <span className="text-2xl font-black text-white">{data.total_clients}</span>
                  </div>
                  <p className="text-[11px] text-gray-600">Всего клиентов</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <svg className="w-3 h-3 text-accent-orange" fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l1.41-1.41L7.83 13H20v-2H7.83l5.58-5.59L12 4l-8 8z"/></svg>
                    <span className="text-2xl font-black text-white">{data.active_orders}</span>
                  </div>
                  <p className="text-[11px] text-gray-600">В работе</p>
                </div>
              </div>
              <div className="mt-3">
                <MiniLineChart color="#FF9300" />
              </div>
            </div>

            {/* ПРОДУКТ card */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <span className="section-title">Продукт</span>
                <DotsIcon />
              </div>
              <div className="flex items-end justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <svg className="w-3 h-3 text-accent-green" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/></svg>
                    <span className="text-2xl font-black text-white">{data.total_orders}</span>
                  </div>
                  <p className="text-[11px] text-gray-600">Всего заказов</p>
                </div>
                <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <svg className="w-3 h-3 text-accent-orange" fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l1.41-1.41L7.83 13H20v-2H7.83l5.58-5.59L12 4l-8 8z"/></svg>
                    <span className="text-2xl font-black text-white">{data.overdue_orders}</span>
                  </div>
                  <p className="text-[11px] text-gray-600">Просрочено</p>
                </div>
              </div>
              <div className="mt-3">
                <DotMatrix greenCount={data.total_orders - data.overdue_orders} orangeCount={data.overdue_orders} total={Math.max(data.total_orders, 30)} />
              </div>
            </div>
          </div>

          {/* ПРОДУКТ — bubble chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <span className="section-title">Продукт — Услуги</span>
              <DotsIcon />
            </div>
            <BubbleChart data={bubbleData} />
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-white/40" />
                <span className="text-[11px] text-gray-600">Ресурсы</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-green" />
                <span className="text-[11px] text-gray-600">Активно</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-accent-orange" />
                <span className="text-[11px] text-gray-600">Просрочено</span>
              </div>
              <span className="ml-auto text-[11px] text-gray-600">
                Всего: <span className="text-white font-semibold">{data.total_orders.toLocaleString('ru-RU')}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right 1/3 — Timeline */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="section-title">Таймлайн проектов</span>
            <DotsIcon />
          </div>

          {/* Scale labels */}
          <div className="flex justify-between pl-14 mb-1">
            {[0, 5, 10, 15, 20, 25, 30].map(n => (
              <span key={n} className="text-[9px] text-gray-700">{n}</span>
            ))}
          </div>

          {/* Timeline rows */}
          <div className="space-y-0.5 flex-1">
            {recentOrders.length === 0 ? (
              <div className="text-center text-gray-600 text-sm py-8">Нет заказов</div>
            ) : (
              recentOrders.map((o, i) => {
                const widthPct = Math.min(90, 15 + (o.final_price / 500));
                const startPct = Math.max(0, (i * 8) % 40);
                return (
                  <TimelineRow
                    key={o.id}
                    label={new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    start={startPct}
                    width={widthPct}
                    color={timelineColors[i % timelineColors.length]}
                    value={o.final_price}
                  />
                );
              })
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-dark-border">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent-green" />
              <span className="text-[11px] text-gray-600">Клиент</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent-orange" />
              <span className="text-[11px] text-gray-600">Продукт</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white/30" />
              <span className="text-[11px] text-gray-600">Веб</span>
            </div>
            <span className="ml-auto text-[11px] text-gray-600">
              Всего: <span className="text-white font-semibold">{recentOrders.length}</span>
            </span>
          </div>

          {/* Link */}
          <Link to="/orders" className="mt-3 text-center text-xs text-accent-green/70 hover:text-accent-green transition-colors">
            Все заказы →
          </Link>
        </div>
      </div>

      {/* Recent orders table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="section-title">Последние заказы</span>
          <Link to="/orders" className="text-xs text-accent-green/70 hover:text-accent-green transition-colors">Все заказы →</Link>
        </div>
        <div className="space-y-0">
          {data.recent_orders.map((o, i) => (
            <div
              key={o.id}
              className={`flex items-center justify-between py-2.5 ${
                i < data.recent_orders.length - 1 ? 'border-b border-dark-border' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-dark-hover border border-dark-border flex items-center justify-center text-xs text-gray-600 font-mono">
                  #{o.id}
                </div>
                <div>
                  <Link to="/orders" className="text-sm font-medium text-white hover:text-accent-green transition-colors">
                    {o.title}
                  </Link>
                  <p className="text-xs text-gray-600 mt-0.5">{o.client_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`badge text-xs ${statusColors[o.status]}`}>{statusLabels[o.status]}</span>
                <span className="text-sm font-bold text-white">{o.final_price.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
