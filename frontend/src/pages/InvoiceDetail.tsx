import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Invoice, PaymentMethod, PaymentPlan } from '../types';
import { paymentsService } from '../services/paymentsService';
import { useFetch } from '../hooks/useFetch';
import { PaymentWidget } from '../components/PaymentWidget';
import { DatePickerField } from '../components/DatePickerField';

const PLAN_STATUS_LABELS = { pending: 'Ожидает', paid: 'Оплачено', overdue: 'Просрочено' } as const;
const PLAN_STATUS_COLORS = {
  pending: 'text-gray-400',
  paid: 'text-accent-green',
  overdue: 'text-red-400',
} as const;

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
  const [refundForm, setRefundForm] = useState<{ paymentId: number | null; amount: string; reason: string }>({ paymentId: null, amount: '', reason: '' });
  const [payment, setPayment] = useState<{ installment?: PaymentPlan; amount: number; title: string } | null>(null);

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title">Счёт #{invoice.id}</h1>
          <p className="text-sm text-gray-500">Заказ #{invoice.order_id} · {invoice.amount.toLocaleString()} ₽ · {invoice.status}</p>
          <p className="text-xs text-gray-600 mt-0.5">Выставлен: {invoice.issue_date} · Срок: {invoice.due_date}</p>
        </div>
        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
          <button className="btn-primary" onClick={() => setPayment({ amount: invoice.amount, title: `Оплата счёта #${invoice.id}` })}>
            Оплатить картой
          </button>
        )}
      </div>

      {payment && (
        <PaymentWidget
          invoiceId={invoiceId}
          installmentId={payment.installment?.id}
          amount={payment.amount}
          title={payment.title}
          onClose={() => setPayment(null)}
          onPaid={() => {
            setPayment(null);
            addToast('Платёж прошёл успешно', 'success');
            refetch();
          }}
        />
      )}

      {/* Payments */}
      <section className="card space-y-3">
        <h2 className="text-sm font-semibold text-white">Платежи</h2>
        <form onSubmit={addPayment} className="flex gap-2 flex-wrap">
          <DatePickerField className="w-44" value={payForm.payment_date} onChange={v => setPayForm(f => ({ ...f, payment_date: v }))} placeholder="Дата платежа" required />
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
          <DatePickerField className="w-44" value={planForm.first_due_date} onChange={v => setPlanForm(f => ({ ...f, first_due_date: v }))} placeholder="Первый платёж" required />
          <button className="btn-primary" type="submit">Создать</button>
        </form>
        {invoice.payment_plans.length > 0 && (
          <>
            <p className="text-xs text-gray-500">
              График из {invoice.payment_plans.length} частей по {invoice.payment_plans[0].amount.toLocaleString()} ₽. Каждую часть можно оплатить картой по отдельности — счёт станет «Оплачен», когда будут закрыты все части.
            </p>
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-gray-500"><th>№</th><th>Дата</th><th>Сумма</th><th>Статус</th><th /></tr></thead>
              <tbody>
                {invoice.payment_plans.map(p => (
                  <tr key={p.id} className="border-t border-dark-border text-gray-300">
                    <td className="py-1">{p.installment_number}</td>
                    <td>{p.due_date}</td>
                    <td>{p.amount.toLocaleString()} ₽</td>
                    <td className={PLAN_STATUS_COLORS[p.status]}>{PLAN_STATUS_LABELS[p.status]}</td>
                    <td className="text-right">
                      {p.status !== 'paid' && (
                        <button
                          className="text-xs text-accent-green hover:underline"
                          onClick={() => setPayment({ installment: p, amount: p.amount, title: `Оплата части №${p.installment_number} счёта #${invoice.id}` })}
                        >
                          Оплатить часть
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  );
}
