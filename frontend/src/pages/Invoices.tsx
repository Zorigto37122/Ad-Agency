import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Invoice, InvoiceStatus } from '../types';
import { paymentsService } from '../services/paymentsService';
import { useFetch } from '../hooks/useFetch';
import { PaymentWidget } from '../components/PaymentWidget';
import { DatePickerField } from '../components/DatePickerField';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Черновик', sent: 'Отправлен', paid: 'Оплачен', overdue: 'Просрочен', cancelled: 'Отменён',
};
const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-700 text-gray-300',
  sent: 'bg-blue-900 text-blue-300',
  paid: 'bg-green-900 text-green-300',
  overdue: 'bg-red-900 text-red-300',
  cancelled: 'bg-gray-800 text-gray-500',
};

const emptyForm = { order_id: '', issue_date: '', due_date: '', amount: '', notes: '' };

export function Invoices({ addToast }: Props) {
  const { data: invoices, loading, refetch } = useFetch<Invoice[]>(() => paymentsService.listInvoices());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [payInvoice, setPayInvoice] = useState<Invoice | null>(null);

  const set = (k: keyof typeof emptyForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentsService.createInvoice({
        order_id: parseInt(form.order_id),
        issue_date: form.issue_date,
        due_date: form.due_date,
        amount: parseFloat(form.amount),
        notes: form.notes || undefined,
      });
      addToast('Счёт создан', 'success');
      setShowForm(false);
      setForm(emptyForm);
      refetch();
    } catch { addToast('Ошибка', 'error'); } finally { setSaving(false); }
  };

  const totalPaid = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0) ?? 0;

  return (
    <div className="page-content">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Счета</h1>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Отмена' : '+ Новый счёт'}</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-white">{invoices?.length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Всего счетов</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-accent-green">{totalPaid.toLocaleString()} ₽</p>
          <p className="text-xs text-gray-500 mt-1">Оплачено</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-400">{invoices?.filter(i => i.status === 'overdue').length ?? 0}</p>
          <p className="text-xs text-gray-500 mt-1">Просрочено</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card space-y-3 mt-4">
          <h2 className="text-sm font-semibold text-white">Новый счёт</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">ID заказа *</label>
              <input className="input w-full" type="number" value={form.order_id} onChange={e => set('order_id', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Сумма *</label>
              <input className="input w-full" type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Дата выставления *</label>
              <DatePickerField value={form.issue_date} onChange={v => set('issue_date', v)} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Срок оплаты *</label>
              <DatePickerField value={form.due_date} onChange={v => set('due_date', v)} required />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Заметки</label>
              <input className="input w-full" value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Сохранение...' : 'Создать'}</button>
        </form>
      )}

      {loading ? <p className="text-gray-500 text-sm mt-4">Загрузка...</p> : !invoices?.length ? (
        <p className="text-gray-500 text-sm mt-4">Счетов нет.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {invoices.map(inv => (
            <Link key={inv.id} to={`/invoices/${inv.id}`} className="card flex items-center justify-between hover:border-accent-green/40 transition-all">
              <div>
                <p className="text-white font-medium">Счёт #{inv.id} · Заказ #{inv.order_id}</p>
                <p className="text-xs text-gray-500 mt-0.5">Срок: {inv.due_date}</p>
              </div>
              <div className="text-right flex items-center gap-3">
                <div>
                  <p className="text-white font-bold">{inv.amount.toLocaleString()} ₽</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[inv.status]}`}>{STATUS_LABELS[inv.status]}</span>
                </div>
                {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                  <button
                    className="btn-primary text-xs py-1.5 px-3"
                    onClick={(e) => { e.preventDefault(); setPayInvoice(inv); }}
                  >
                    Оплатить
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {payInvoice && (
        <PaymentWidget
          invoiceId={payInvoice.id}
          amount={payInvoice.amount}
          title={`Оплата счёта #${payInvoice.id}`}
          onClose={() => setPayInvoice(null)}
          onPaid={() => {
            setPayInvoice(null);
            addToast('Платёж прошёл успешно', 'success');
            refetch();
          }}
        />
      )}
    </div>
  );
}
