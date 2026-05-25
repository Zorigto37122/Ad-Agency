import React, { useState } from 'react';
import { messagesService } from '../services/messagesService';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error') => void;
}

export function Contact({ addToast }: Props) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      await messagesService.send({ subject: subject.trim(), body: body.trim() });
      setSent(true);
      setSubject('');
      setBody('');
      addToast('Сообщение отправлено', 'success');
    } catch {
      addToast('Не удалось отправить сообщение', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page-content max-w-2xl">
      <h1 className="page-title">Связаться с нами</h1>

      {/* Contact info */}
      <div className="card space-y-3">
        <p className="text-sm text-gray-400">Есть вопросы по заказу или предложения? Напишите нам — мы ответим в ближайшее время.</p>
        <div className="flex items-center gap-3 p-3 bg-dark-hover rounded-xl border border-dark-border">
          <svg className="w-5 h-5 text-accent-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-xs text-gray-600">Email</p>
            <p className="text-sm font-medium text-white">admin@adagency.com</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {sent ? (
        <div className="card flex flex-col items-center gap-4 py-10">
          <div className="w-14 h-14 rounded-full bg-accent-green/20 border border-accent-green/30 flex items-center justify-center">
            <svg className="w-7 h-7 text-accent-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-white">Сообщение отправлено!</p>
            <p className="text-sm text-gray-500 mt-1">Мы свяжемся с вами в ближайшее время.</p>
          </div>
          <button onClick={() => setSent(false)} className="btn-secondary text-sm">
            Написать ещё
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="section-title">Новое сообщение</h2>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Тема</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Кратко опишите вопрос"
              className="input w-full"
              required
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Сообщение</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Опишите ваш вопрос или предложение подробнее..."
              className="input w-full resize-none"
              rows={6}
              required
              maxLength={2000}
            />
            <p className="text-xs text-gray-700 mt-1 text-right">{body.length} / 2000</p>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending || !subject.trim() || !body.trim()}
              className="btn-primary"
            >
              {sending ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Contact;
