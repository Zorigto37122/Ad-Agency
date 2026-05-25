import React, { useState } from 'react';
import { Lead, LeadStatus, LeadSource } from '../types';
import { crmService } from '../services/crmService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Новый', contacted: 'Связались', qualified: 'Квалифицирован', proposal: 'КП отправлено', won: 'Выигран', lost: 'Проигран',
};
const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-gray-700 text-gray-300',
  contacted: 'bg-blue-900 text-blue-300',
  qualified: 'bg-purple-900 text-purple-300',
  proposal: 'bg-yellow-900 text-yellow-300',
  won: 'bg-green-900 text-green-300',
  lost: 'bg-red-900 text-red-300',
};
const SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Сайт', referral: 'Рекомендация', social: 'Соцсети', cold_call: 'Холодный звонок', event: 'Мероприятие', other: 'Другое',
};

const emptyForm = { name: '', email: '', phone: '', company: '', source: 'other' as LeadSource, notes: '' };

export function Leads({ addToast }: Props) {
  const { data: leads, loading, refetch } = useFetch<Lead[]>(() => crmService.listLeads());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await crmService.createLead({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        company: form.company || undefined,
        source: form.source,
        notes: form.notes || undefined,
      });
      addToast('Лид создан', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch { addToast('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const changeStatus = async (lead: Lead, status: LeadStatus) => {
    try {
      await crmService.updateLead(lead.id, { status });
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  const convert = async (id: number) => {
    try {
      await crmService.convertLead(id);
      addToast('Лид конвертирован в клиента', 'success');
      refetch();
    } catch (err: any) {
      addToast(err?.response?.data?.detail || 'Ошибка', 'error');
    }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Лиды</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Отмена' : '+ Новый лид'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Имя *</label><input className="input w-full" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Email</label><input className="input w-full" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Телефон</label><input className="input w-full" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Компания</label><input className="input w-full" value={form.company} onChange={e => set('company', e.target.value)} /></div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Источник</label>
              <select className="input w-full" value={form.source} onChange={e => set('source', e.target.value as LeadSource)}>
                {(Object.keys(SOURCE_LABELS) as LeadSource[]).map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
              </select>
            </div>
            <div><label className="block text-xs text-gray-500 mb-1">Заметки</label><input className="input w-full" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
        </form>
      )}

      {loading ? <p className="text-gray-500 text-sm mt-4">Загрузка...</p> : !leads?.length ? (
        <p className="text-gray-500 text-sm mt-4">Лидов нет.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {leads.map(lead => (
            <div key={lead.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium">{lead.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lead.company && `${lead.company} · `}{lead.email}{lead.phone && ` · ${lead.phone}`}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{SOURCE_LABELS[lead.source]}</p>
                  {lead.notes && <p className="text-xs text-gray-600 mt-1">{lead.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[lead.status]}`}>{STATUS_LABELS[lead.status]}</span>
                  <select
                    className="input text-xs py-0.5"
                    value={lead.status}
                    onChange={e => changeStatus(lead, e.target.value as LeadStatus)}
                  >
                    {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  {lead.status !== 'won' && lead.status !== 'lost' && (
                    <button className="text-xs text-accent-green hover:underline" onClick={() => convert(lead.id)}>Конвертировать</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
