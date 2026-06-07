import React, { useState } from 'react';
import { ContentCalendarEntry, ContentType, ContentStatus } from '../types';
import { placementsService } from '../services/placementsService';
import { useFetch } from '../hooks/useFetch';
import { DatePickerField } from '../components/DatePickerField';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CONTENT_TYPE_COLORS: Record<ContentType, string> = {
  image: 'bg-blue-900 text-blue-300',
  video: 'bg-purple-900 text-purple-300',
  text: 'bg-gray-700 text-gray-300',
  carousel: 'bg-yellow-900 text-yellow-300',
  story: 'bg-pink-900 text-pink-300',
};
const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  image: 'Изображение', video: 'Видео', text: 'Текст', carousel: 'Карусель', story: 'Сторис',
};

const emptyForm = { campaign_id: '', title: '', content_type: 'image' as ContentType, scheduled_date: '', notes: '' };

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function ContentCalendar({ addToast }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  const { data: entries, refetch } = useFetch<ContentCalendarEntry[]>(() => placementsService.listCalendar({ month: monthStr }), [monthStr]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await placementsService.createCalendarEntry({
        campaign_id: parseInt(form.campaign_id),
        title: form.title,
        content_type: form.content_type,
        scheduled_date: form.scheduled_date,
        notes: form.notes || undefined,
      });
      addToast('Запись добавлена', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch { addToast('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const entriesByDay: Record<number, ContentCalendarEntry[]> = {};
  entries?.forEach(e => {
    const day = parseInt(e.scheduled_date.split('-')[2]);
    if (!entriesByDay[day]) entriesByDay[day] = [];
    entriesByDay[day].push(e);
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthNames = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Контент-план</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Отмена' : '+ Добавить запись'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">ID кампании *</label><input className="input w-full" type="number" value={form.campaign_id} onChange={e => set('campaign_id', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Название *</label><input className="input w-full" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Тип контента</label>
              <select className="input w-full" value={form.content_type} onChange={e => set('content_type', e.target.value as ContentType)}>
                {(Object.keys(CONTENT_TYPE_LABELS) as ContentType[]).map(t => <option key={t} value={t}>{CONTENT_TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">Дата *</label><DatePickerField value={form.scheduled_date} onChange={v => set('scheduled_date', v)} required /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Заметки</label><input className="input w-full" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Добавить'}</button>
        </form>
      )}

      <div className="mt-4 card">
        <div className="flex items-center justify-between mb-4">
          <button className="text-gray-400 hover:text-white" onClick={prevMonth}>← </button>
          <h2 className="text-white font-semibold">{monthNames[month]} {year}</h2>
          <button className="text-gray-400 hover:text-white" onClick={nextMonth}> →</button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Вс','Пн','Вт','Ср','Чт','Пт','Сб'].map(d => (
            <div key={d} className="text-center text-xs text-gray-500 pb-1">{d}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => (
            <div key={day} className="min-h-16 bg-dark-hover rounded-lg p-1 border border-dark-border">
              <p className="text-xs text-gray-500 mb-1">{day}</p>
              {(entriesByDay[day] || []).map(e => (
                <span key={e.id} className={`block text-xs px-1 rounded mb-0.5 truncate ${CONTENT_TYPE_COLORS[e.content_type]}`} title={e.title}>
                  {e.title}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
