import React from 'react';

function PlaceholderChart({ height = 120, label }: { height?: number; label: string }) {
  return (
    <div
      className="w-full rounded-xl bg-dark-hover border border-dark-border flex items-end justify-around px-4 pb-4 pt-6 gap-2"
      style={{ height }}
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-md opacity-40"
          style={{
            height: `${30 + Math.sin(i * 1.2) * 25 + Math.random() * 20}%`,
            background: i % 2 === 0 ? '#7DC832' : '#FF9300',
          }}
        />
      ))}
    </div>
  );
}

function StatPlaceholder({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="card flex flex-col gap-2">
      <span className="section-title">{label}</span>
      <p className="text-3xl font-black" style={{ color }}>{value}</p>
      <p className="text-xs text-gray-600">{sub}</p>
      <div className="h-1 rounded-full bg-dark-border mt-1">
        <div className="h-1 rounded-full w-2/3" style={{ background: color }} />
      </div>
    </div>
  );
}

export function Monitoring() {
  return (
    <div className="page-content">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="page-title">Мониторинг</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Период:</span>
          {['День', 'Неделя', 'Месяц', 'Год'].map((p, i) => (
            <button
              key={p}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                i === 2
                  ? 'bg-accent-green text-black'
                  : 'bg-dark-card border border-dark-border text-gray-500 hover:text-gray-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Status banner */}
      <div className="card flex items-center gap-4 border-l-2 border-l-accent-green">
        <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Все системы работают в штатном режиме</p>
          <p className="text-xs text-gray-600 mt-0.5">Последнее обновление: только что</p>
        </div>
        <span className="ml-auto badge badge-green">Онлайн</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <StatPlaceholder label="Нагрузка" value="24%" sub="Среднее за день" color="#7DC832" />
        <StatPlaceholder label="Запросов/мин" value="1 240" sub="+12% к прошлой неделе" color="#7DC832" />
        <StatPlaceholder label="Ошибки" value="0.3%" sub="За последний час" color="#FF9300" />
        <StatPlaceholder label="Время отклика" value="142мс" sub="Медиана p50" color="#7DC832" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-5">
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="section-title">Активность заказов</span>
            <span className="text-xs text-gray-600">За 30 дней</span>
          </div>
          <PlaceholderChart height={160} label="Активность" />
          <p className="text-xs text-gray-700 text-center">← Данные будут подключены в следующей версии →</p>
        </div>

        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="section-title">Выручка</span>
            <span className="text-xs text-gray-600">За 30 дней</span>
          </div>
          <PlaceholderChart height={160} label="Выручка" />
          <p className="text-xs text-gray-700 text-center">← Данные будут подключены в следующей версии →</p>
        </div>
      </div>

      {/* Service health */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <span className="section-title">Состояние сервисов</span>
          <span className="text-xs text-gray-600">Обновляется в реальном времени</span>
        </div>
        <div className="space-y-3">
          {[
            { name: 'API сервер', status: 'online', latency: '12мс', uptime: '99.9%' },
            { name: 'База данных', status: 'online', latency: '3мс', uptime: '100%' },
            { name: 'Хранилище файлов', status: 'online', latency: '45мс', uptime: '99.7%' },
            { name: 'Email-рассылка', status: 'degraded', latency: '320мс', uptime: '97.2%' },
            { name: 'Аналитика', status: 'maintenance', latency: '—', uptime: '—' },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between py-2 border-b border-dark-border last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  s.status === 'online' ? 'bg-accent-green' :
                  s.status === 'degraded' ? 'bg-accent-orange' :
                  'bg-gray-600'
                }`} />
                <span className="text-sm text-white">{s.name}</span>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <span className="text-gray-600">Задержка: <span className="text-white">{s.latency}</span></span>
                <span className="text-gray-600">Доступность: <span className="text-white">{s.uptime}</span></span>
                <span className={`badge ${
                  s.status === 'online' ? 'badge-green' :
                  s.status === 'degraded' ? 'badge-orange' :
                  'badge-gray'
                }`}>
                  {s.status === 'online' ? 'Работает' : s.status === 'degraded' ? 'Снижение' : 'Обслуживание'}
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
