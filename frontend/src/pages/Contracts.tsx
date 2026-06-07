import React, { useState } from 'react';
import { Contract, ContractStatus } from '../types';
import { crmService } from '../services/crmService';
import { useFetch } from '../hooks/useFetch';
import { DatePickerField } from '../components/DatePickerField';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Черновик', pending_signature: 'Ожидает подписи', signed: 'Подписан', expired: 'Истёк', terminated: 'Расторгнут',
};
const STATUS_COLORS: Record<ContractStatus, string> = {
  draft: 'bg-gray-700 text-gray-300',
  pending_signature: 'bg-yellow-900 text-yellow-300',
  signed: 'bg-green-900 text-green-300',
  expired: 'bg-gray-800 text-gray-500',
  terminated: 'bg-red-900 text-red-300',
};

const emptyForm = { client_id: '', title: '', order_id: '', content: '', expires_at: '' };

export function Contracts({ addToast }: Props) {
  const { data: contracts, loading, refetch } = useFetch<Contract[]>(() => crmService.listContracts());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await crmService.createContract({
        client_id: parseInt(form.client_id),
        title: form.title,
        order_id: form.order_id ? parseInt(form.order_id) : undefined,
        content: form.content || undefined,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : undefined,
      });
      addToast('Контракт создан', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch { addToast('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const sign = async (contract: Contract) => {
    try {
      await crmService.updateContract(contract.id, { status: 'signed', signed_at: new Date().toISOString() });
      addToast('Контракт подписан', 'success');
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Контракты</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Отмена' : '+ Новый контракт'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">ID клиента *</label><input className="input w-full" type="number" value={form.client_id} onChange={e => set('client_id', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Название *</label><input className="input w-full" value={form.title} onChange={e => set('title', e.target.value)} required /></div>
            <div><label className="block text-xs text-gray-500 mb-1">ID заказа</label><input className="input w-full" type="number" value={form.order_id} onChange={e => set('order_id', e.target.value)} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Истекает</label><DatePickerField value={form.expires_at} onChange={v => set('expires_at', v)} /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Содержание</label><textarea className="input w-full" rows={4} value={form.content} onChange={e => set('content', e.target.value)} /></div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
        </form>
      )}

      {loading ? <p className="text-gray-500 text-sm mt-4">Загрузка...</p> : !contracts?.length ? (
        <p className="text-gray-500 text-sm mt-4">Контрактов нет.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {contracts.map(c => (
            <div key={c.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-medium">{c.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Клиент #{c.client_id}{c.order_id ? ` · Заказ #${c.order_id}` : ''}</p>
                  {c.expires_at && <p className="text-xs text-gray-600 mt-0.5">Истекает: {new Date(c.expires_at).toLocaleDateString('ru')}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status]}`}>{STATUS_LABELS[c.status]}</span>
                  {c.status === 'pending_signature' && (
                    <button className="text-xs text-accent-green hover:underline" onClick={() => sign(c)}>Подписать</button>
                  )}
                  {c.signed_at && <p className="text-xs text-gray-600">Подписан: {new Date(c.signed_at).toLocaleDateString('ru')}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
