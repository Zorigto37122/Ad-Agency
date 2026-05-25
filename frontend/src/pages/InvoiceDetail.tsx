import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Invoice, PaymentMethod, TaxType } from '../types';
import { paymentsService } from '../services/paymentsService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  card: 'Карта', bank_transfer: 'Банк. перевод', cash: 'Наличные', crypto: 'Крипто',
};

export function InvoiceDetail({ addToast }: Props) {
  const { id } = useParams<{ id: string }>();
  const invoiceId = parseInt(id || '0');
  const { data: invoice, loading, refetch } = useFetch<Invoice>(() => paymentsService.getInvoice(invoiceId), [invoiceId]);

  const [payForm, setPayForm] = useState({ payment_date: '', amount: '', method: 'card' as PaymentMethod, currency: 'RUB' });
  const [planForm, setPlanForm] = useState({ installments: '', first_due_date: '' });
  const [taxForm, setTaxForm] = useState({ tax_type: 'vat' as TaxType, tax_rate: '' });
  const [feeForm, setFeeForm] = useState({ amount: '', reason: '' });
  const [refundForm, setRefundForm] = useState<{ paymentId: number | null; amount: string; reason: string }>({ paymentId: null, amount: '', reason: '' });

  const addPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentsService.addPayment(invoiceId, {
        payment_date: new Date(payForm.payment_date).toISOString(),
        amount: parseFloat(payForm.amount),
        method: payForm.method,
        currency: payForm.currency,
      });
      addToast('Платёж добавлен', 'success');
      setPayForm({ payment_date: '', amount: '', method: 'card', currency: 'RUB' });
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentsService.createPaymentPlan(invoiceId, { installments: parseInt(planForm.installments), first_due_date: planForm.first_due_date });
      addToast('Рассрочка создана', 'success');
      setPlanForm({ installments: '', first_due_date: '' });
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  const addTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentsService.addTaxRecord(invoiceId, { tax_type: taxForm.tax_type, tax_rate: parseFloat(taxForm.tax_rate) });
      addToast('Налог добавлен', 'success');
      setTaxForm({ tax_type: 'vat', tax_rate: '' });
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  const addFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentsService.addLateFee(invoiceId, { amount: parseFloat(feeForm.amount), reason: feeForm.reason || undefined });
      addToast('Штраф добавлен', 'success');
      setFeeForm({ amount: '', reason: '' });
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  const addRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundForm.paymentId) return;
    try {
      await paymentsService.createRefund(invoiceId, refundForm.paymentId, { amount: parseFloat(refundForm.amount), reason: refundForm.reason });
      addToast('Возврат создан', 'success');
      setRefundForm({ paymentId: null, amount: '', reason: '' });
      refetch();
    } catch { addToast('Ошибка', 'error'); }
  };

  if (loading) return <div className="page-content"><p className="text-gray-500 text-sm">Загрузка...</p></div>;
  if (!invoice) return <div className="page-content"><p className="text-gray-500 text-sm">Счёт не найден.</p></div>;

  return (
    <div className="page-content space-y-6">
      <div>
        <h1 className="page-title">Счёт #{invoice.id}</h1>
        <p className="text-sm text-gray-500">Заказ #{invoice.order_id} · {invoice.amount.toLocaleString()} ₽ · {invoice.status}</p>
        <p className="text-xs text-gray-600 mt-0.5">Выставлен: {invoice.issue_date} · Срок: {invoice.due_date}</p>
      </div>

      {/* Payments */}
      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Платежи</h2>
        <form onSubmit={addPayment} className="flex gap-2 flex-wrap">
          <input className="input" type="date" value={payForm.payment_date} onChange={e => setPayForm(f => ({ ...f, payment_date: e.target.value }))} required />
          <input className="input" type="number" step="0.01" placeholder="Сумма" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required />
          <select className="input" value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value as PaymentMethod }))}>
            {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map(m => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
          </select>
          <input className="input" placeholder="Валюта" value={payForm.currency} onChange={e => setPayForm(f => ({ ...f, currency: e.target.value }))} style={{ width: 80 }} />
          <button className="btn-primary" type="submit">Добавить</button>
        </form>
        {invoice.payments.length > 0 && (
          <div className="space-y-2">
            {invoice.payments.map(p => (
              <div key={p.id} className="bg-dark-hover rounded-xl p-3 border border-dark-border">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{p.amount.toLocaleString()} {p.currency} · {METHOD_LABELS[p.method]}</span>
                  <span className="text-gray-500">{new Date(p.payment_date).toLocaleDateString('ru')}</span>
                </div>
                <div className="flex gap-3 mt-1">
                  <span className="text-xs text-gray-500">{p.status}</span>
                  <button className="text-xs text-yellow-400 hover:underline" onClick={() => setRefundForm({ paymentId: p.id, amount: '', reason: '' })}>
                    Возврат
                  </button>
                </div>
                {p.refunds.length > 0 && p.refunds.map(r => (
                  <div key={r.id} className="text-xs text-red-300 mt-1">↩ Возврат {r.amount.toLocaleString()} ₽ · {r.reason} · {r.status}</div>
                ))}
              </div>
            ))}
          </div>
        )}
        {refundForm.paymentId && (
          <form onSubmit={addRefund} className="flex gap-2 flex-wrap border-t border-dark-border pt-2">
            <p className="text-xs text-gray-500 w-full">Возврат для платежа #{refundForm.paymentId}</p>
            <input className="input" type="number" step="0.01" placeholder="Сумма" value={refundForm.amount} onChange={e => setRefundForm(f => ({ ...f, amount: e.target.value }))} required />
            <input className="input" placeholder="Причина" value={refundForm.reason} onChange={e => setRefundForm(f => ({ ...f, reason: e.target.value }))} required />
            <button className="btn-primary" type="submit">Создать возврат</button>
            <button type="button" className="text-xs text-gray-500" onClick={() => setRefundForm({ paymentId: null, amount: '', reason: '' })}>Отмена</button>
          </form>
        )}
      </section>

      {/* Payment Plan */}
      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Рассрочка</h2>
        <form onSubmit={createPlan} className="flex gap-2">
          <input className="input" type="number" placeholder="Частей" value={planForm.installments} onChange={e => setPlanForm(f => ({ ...f, installments: e.target.value }))} required />
          <input className="input" type="date" placeholder="Первый платёж" value={planForm.first_due_date} onChange={e => setPlanForm(f => ({ ...f, first_due_date: e.target.value }))} required />
          <button className="btn-primary" type="submit">Создать</button>
        </form>
        {invoice.payment_plans.length > 0 && (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-500"><th>№</th><th>Дата</th><th>Сумма</th><th>Статус</th></tr></thead>
            <tbody>
              {invoice.payment_plans.map(p => (
                <tr key={p.id} className="border-t border-dark-border text-gray-300">
                  <td className="py-1">{p.installment_number}</td>
                  <td>{p.due_date}</td>
                  <td>{p.amount.toLocaleString()} ₽</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Tax & Fees */}
      <div className="grid grid-cols-2 gap-4">
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold text-white">Налоги</h2>
          <form onSubmit={addTax} className="flex gap-2 flex-wrap">
            <select className="input" value={taxForm.tax_type} onChange={e => setTaxForm(f => ({ ...f, tax_type: e.target.value as TaxType }))}>
              <option value="vat">НДС</option>
              <option value="sales_tax">Налог с продаж</option>
              <option value="withholding">Налог у источника</option>
            </select>
            <input className="input" type="number" step="0.01" placeholder="Ставка %" value={taxForm.tax_rate} onChange={e => setTaxForm(f => ({ ...f, tax_rate: e.target.value }))} required />
            <button className="btn-primary text-xs py-1 px-3" type="submit">Добавить</button>
          </form>
          {invoice.tax_records.map(t => (
            <div key={t.id} className="text-xs text-gray-400">{t.tax_type}: {t.tax_rate}% = {t.tax_amount.toLocaleString()} ₽</div>
          ))}
        </section>
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold text-white">Штрафы</h2>
          <form onSubmit={addFee} className="flex gap-2 flex-wrap">
            <input className="input" type="number" step="0.01" placeholder="Сумма" value={feeForm.amount} onChange={e => setFeeForm(f => ({ ...f, amount: e.target.value }))} required />
            <input className="input" placeholder="Причина" value={feeForm.reason} onChange={e => setFeeForm(f => ({ ...f, reason: e.target.value }))} />
            <button className="btn-primary text-xs py-1 px-3" type="submit">Добавить</button>
          </form>
          {invoice.late_fees.map(f => (
            <div key={f.id} className="text-xs text-gray-400">{f.amount.toLocaleString()} ₽{f.reason ? ` · ${f.reason}` : ''}</div>
          ))}
        </section>
      </div>
    </div>
  );
}
