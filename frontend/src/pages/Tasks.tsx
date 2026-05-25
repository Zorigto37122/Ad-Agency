import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { crmService } from '../services/crmService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'К выполнению', in_progress: 'В работе', review: 'Проверка', done: 'Готово', cancelled: 'Отменено',
};
const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'text-gray-400', medium: 'text-yellow-400', high: 'text-orange-400', critical: 'text-red-400',
};
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', critical: 'Критический',
};

const emptyForm = { title: '', description: '', priority: 'medium' as TaskPriority, due_date: '', order_id: '' };

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export function Tasks({ addToast }: Props) {
  const { data: tasks, loading, refetch } = useFetch<Task[]>(() => crmService.listTasks());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [logTaskId, setLogTaskId] = useState<number | null>(null);
  const [logForm, setLogForm] = useState({ hours: '', logged_at: '', description: '' });

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await crmService.createTask({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        due_date: form.due_date || undefined,
        order_id: form.order_id ? parseInt(form.order_id) : undefined,
      });
      addToast('Задача создана', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch { addToast('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const changeStatus = async (task: Task, newStatus: TaskStatus) => {
    try {
      await crmService.updateTask(task.id, { status: newStatus });
      addToast('Статус обновлён', 'success');
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  const submitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logTaskId) return;
    try {
      await crmService.logTime(logTaskId, { hours: parseFloat(logForm.hours), logged_at: logForm.logged_at, description: logForm.description || undefined });
      addToast('Время записано', 'success');
      setLogTaskId(null);
      setLogForm({ hours: '', logged_at: '', description: '' });
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  const byStatus = (s: TaskStatus) => tasks?.filter(t => t.status === s) ?? [];
  const totalHours = (task: Task) => task.time_logs.reduce((sum, l) => sum + l.hours, 0);

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Задачи</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Отмена' : '+ Новая задача'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Название *</label>
              <input className="input w-full" value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Приоритет</label>
              <select className="input w-full" value={form.priority} onChange={e => set('priority', e.target.value as TaskPriority)}>
                {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Срок</label>
              <input className="input w-full" type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">ID заказа</label>
              <input className="input w-full" type="number" value={form.order_id} onChange={e => set('order_id', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Описание</label>
              <input className="input w-full" value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
        </form>
      )}

      {logTaskId && (
        <form onSubmit={submitLog} className="card mt-4 flex gap-2 flex-wrap items-end">
          <p className="text-xs text-gray-500 w-full">Запись времени для задачи #{logTaskId}</p>
          <input className="input" type="number" step="0.5" placeholder="Часы" value={logForm.hours} onChange={e => setLogForm(f => ({ ...f, hours: e.target.value }))} required />
          <input className="input" type="date" value={logForm.logged_at} onChange={e => setLogForm(f => ({ ...f, logged_at: e.target.value }))} required />
          <input className="input" placeholder="Описание" value={logForm.description} onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))} />
          <button className="btn-primary" type="submit">Записать</button>
          <button type="button" className="text-xs text-gray-500" onClick={() => setLogTaskId(null)}>Отмена</button>
        </form>
      )}

      {loading ? <p className="text-gray-500 text-sm mt-4">Загрузка...</p> : (
        <div className="mt-4 grid grid-cols-4 gap-3">
          {COLUMNS.map(col => (
            <div key={col}>
              <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">{STATUS_LABELS[col]}</h3>
              <div className="space-y-2">
                {byStatus(col).map(task => (
                  <div key={task.id} className="card space-y-2">
                    <p className="text-sm text-white font-medium">{task.title}</p>
                    <p className={`text-xs font-medium ${PRIORITY_COLORS[task.priority]}`}>{PRIORITY_LABELS[task.priority]}</p>
                    {task.due_date && <p className="text-xs text-gray-600">Срок: {task.due_date}</p>}
                    {task.time_logs.length > 0 && <p className="text-xs text-gray-600">⏱ {totalHours(task)}ч</p>}
                    <div className="flex gap-1 flex-wrap">
                      {COLUMNS.filter(s => s !== col).map(s => (
                        <button key={s} className="text-xs text-accent-green hover:underline" onClick={() => changeStatus(task, s)}>→ {STATUS_LABELS[s]}</button>
                      ))}
                    </div>
                    <button className="text-xs text-gray-500 hover:text-white" onClick={() => setLogTaskId(task.id)}>+ время</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
