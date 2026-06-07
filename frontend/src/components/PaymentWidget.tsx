import React, { useEffect, useRef, useState } from 'react';
import { paymentsService } from '../services/paymentsService';

interface Props {
  invoiceId: number;
  installmentId?: number;
  amount: number;
  title: string;
  onClose: () => void;
  onPaid: () => void;
}

const WIDGET_SCRIPT_URL = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js';
let widgetScriptPromise: Promise<void> | null = null;

function loadWidgetScript(): Promise<void> {
  if (window.YooMoneyCheckoutWidget) return Promise.resolve();
  if (!widgetScriptPromise) {
    widgetScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = WIDGET_SCRIPT_URL;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Не удалось загрузить виджет оплаты'));
      document.body.appendChild(script);
    });
  }
  return widgetScriptPromise;
}

declare global {
  interface Window {
    YooMoneyCheckoutWidget?: new (options: Record<string, unknown>) => {
      render: (containerId: string) => Promise<void>;
      destroy: () => void;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

const CONTAINER_ID = 'yookassa-payment-form';

export function PaymentWidget({ invoiceId, installmentId, amount, title, onClose, onPaid }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const widgetRef = useRef<{ destroy: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { confirmation_token } = await paymentsService.initiatePayment(invoiceId, installmentId);
        await loadWidgetScript();
        if (cancelled || !window.YooMoneyCheckoutWidget) return;

        const widget = new window.YooMoneyCheckoutWidget({
          confirmation_token,
          return_url: window.location.href,
          error_callback: (err: unknown) => setError(String(err)),
        });
        widgetRef.current = widget;
        widget.on('success', () => onPaid());
        widget.on('fail', () => setError('Платёж не прошёл. Попробуйте другую карту.'));
        await widget.render(CONTAINER_ID);
        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) {
          setError('Не удалось начать оплату. Проверьте, что онлайн-оплата подключена.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      widgetRef.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, installmentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-500">{amount.toLocaleString()} ₽</p>
          </div>
          <button className="text-gray-500 hover:text-white text-xl leading-none" onClick={onClose}>×</button>
        </div>
        {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
        {loading && !error && <p className="text-sm text-gray-500 mb-3">Загрузка формы оплаты…</p>}
        <div id={CONTAINER_ID} />
        <p className="text-xs text-gray-600 mt-3">Оплата проходит через ЮKassa. В тестовом режиме используйте тестовую карту из личного кабинета магазина — реальные деньги не списываются.</p>
      </div>
    </div>
  );
}

export default PaymentWidget;
