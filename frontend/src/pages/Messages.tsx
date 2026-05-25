import React, { useCallback, useState, useEffect } from 'react';
import { messagesService, Message } from '../services/messagesService';
import { useFetch } from '../hooks/useFetch';

interface Props {
  addToast: (msg: string, type?: 'success' | 'error') => void;
}

export function Messages({ addToast }: Props) {
  const fetchMessages = useCallback(() => messagesService.list(), []);
  const { data: fetched, loading } = useFetch<Message[]>(fetchMessages, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selected, setSelected] = useState<Message | null>(null);

  useEffect(() => {
    if (fetched) setMessages(fetched);
  }, [fetched]);

  const unread = messages.filter((m) => !m.is_read).length;

  const handleSelect = async (msg: Message) => {
    setSelected(msg);
    if (!msg.is_read) {
      try {
        const updated = await messagesService.markRead(msg.id);
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? updated : m)));
        setSelected(updated);
      } catch {
        // silent
      }
    }
  };

  return (
    <div className="page-content max-w-5xl">
      <div className="flex items-center gap-3">
        <h1 className="page-title mb-0">Сообщения</h1>
        {unread > 0 && (
          <span className="badge badge-orange text-xs">{unread} новых</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {/* List */}
        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-accent-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center text-gray-600 text-sm">Нет сообщений</div>
          ) : (
            <ul className="divide-y divide-dark-border">
              {messages.map((msg) => (
                <li
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-dark-hover ${
                    selected?.id === msg.id ? 'bg-dark-hover' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!msg.is_read && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-accent-green flex-shrink-0" />
                    )}
                    <div className={`flex-1 min-w-0 ${msg.is_read ? 'ml-4' : ''}`}>
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-sm truncate ${msg.is_read ? 'text-gray-400' : 'text-white font-semibold'}`}>
                          {msg.subject}
                        </p>
                        <span className="text-xs text-gray-700 flex-shrink-0">
                          {new Date(msg.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate mt-0.5">{msg.user_name} · {msg.user_email}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Detail */}
        <div className="card">
          {selected ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-white break-words">{selected.subject}</h2>
                <p className="text-xs text-gray-500 mt-1">
                  От: <span className="text-gray-400">{selected.user_name}</span>{' '}
                  &lt;{selected.user_email}&gt;
                </p>
                <p className="text-xs text-gray-700 mt-0.5">
                  {new Date(selected.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
              <div className="border-t border-dark-border pt-4">
                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{selected.body}</p>
              </div>
              <div className="pt-2">
                <a
                  href={`mailto:${selected.user_email}?subject=Re: ${encodeURIComponent(selected.subject)}`}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Ответить по email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-700">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Выберите сообщение</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
