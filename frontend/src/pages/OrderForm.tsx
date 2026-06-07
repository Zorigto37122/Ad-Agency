import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ordersService } from '../services/ordersService';
import { clientsService } from '../services/clientsService';
import { Client, OrderStatus, ServiceType, ScopeType } from '../types';
import { DatePickerField } from '../components/DatePickerField';

interface Props {
  addToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const SERVICE_OPTIONS: { value: ServiceType; label: string }[] = [
  { value: 'web_design', label: 'Веб-дизайн ($1 000)' },
  { value: 'graphic_design', label: 'Графический дизайн ($500)' },
  { value: 'social_media_campaign', label: 'SMM-кампания ($2 000)' },
  { value: 'video_production', label: 'Видеопроизводство ($3 000)' },
  { value: 'copywriting', label: 'Копирайтинг ($300)' },
];

const SCOPE_OPTIONS: { value: ScopeType; label: string }[] = [
  { value: 'small', label: 'Маленький (×0,75)' },
  { value: 'medium', label: 'Средний (×1,0)' },
  { value: 'large', label: 'Большой (×1,5)' },
];

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Ожидает' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Выполнен' },
  { value: 'cancelled', label: 'Отменён' },
];

const ALLOWED_EXTS = '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.xlsx,.zip';

export function OrderForm({ addToast }: Props) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingFilename, setExistingFilename] = useState<string | null>(null);
  const [form, setForm] = useState({
    client_id: '',
    title: '',
    description: '',
    service_type: 'web_design' as ServiceType,
    scope: 'medium' as ScopeType,
    status: 'pending' as OrderStatus,
    deadline: '',
  });

  useEffect(() => {
    clientsService.list().then(setClients).catch(() => addToast('Не удалось загрузить клиентов', 'error'));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    ordersService.get(Number(id)).then((o) => {
      setForm({
        client_id: String(o.client_id),
        title: o.title,
        description: o.description || '',
        service_type: o.service_type,
        scope: o.scope,
        status: o.status as OrderStatus,
        deadline: o.deadline ? o.deadline.slice(0, 10) : '',
      });
      setExistingFilename(o.attachment_filename);
    }).catch(() => addToast('Не удалось загрузить заказ', 'error'));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const deadline = form.deadline ? new Date(form.deadline).toISOString() : undefined;
      let orderId: number;

      if (isEdit) {
        const updated = await ordersService.update(Number(id), {
          title: form.title,
          description: form.description || undefined,
          service_type: form.service_type,
          scope: form.scope,
          status: form.status,
          deadline,
        });
        orderId = updated.id;
        addToast('Заказ обновлён', 'success');
      } else {
        const created = await ordersService.create({
          client_id: Number(form.client_id),
          title: form.title,
          description: form.description || undefined,
          service_type: form.service_type,
          scope: form.scope,
          deadline,
        });
        orderId = created.id;
        addToast('Заказ создан', 'success');
      }

      if (selectedFile) {
        await ordersService.uploadAttachment(orderId, selectedFile);
        addToast('Файл прикреплён', 'success');
      }

      navigate('/orders');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Не удалось сохранить заказ';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 10 * 1024 * 1024) {
      addToast('Файл слишком большой (максимум 10 МБ)', 'error');
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="page-content max-w-2xl mx-auto">
      <h1 className="page-title">{isEdit ? 'Редактировать заказ' : 'Новый заказ'}</h1>
      <form onSubmit={handleSubmit} className="card space-y-5">
        {!isEdit && (
          <div>
            <label className="label">Клиент *</label>
            <select className="input" required value={form.client_id} onChange={(e) => set('client_id', e.target.value)}>
              <option value="">Выберите клиента…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name} – {c.company || c.email}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Название *</label>
          <input className="input" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Название заказа" />
        </div>
        <div>
          <label className="label">Описание</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Дополнительные сведения…" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Услуга *</label>
            <select className="input" value={form.service_type} onChange={(e) => set('service_type', e.target.value)}>
              {SERVICE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Объём *</label>
            <select className="input" value={form.scope} onChange={(e) => set('scope', e.target.value)}>
              {SCOPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
        {isEdit && (
          <div>
            <label className="label">Статус</label>
            <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Срок выполнения</label>
          <DatePickerField value={form.deadline} onChange={v => set('deadline', v)} />
        </div>

        {/* File attachment */}
        <div>
          <label className="label">Файл с требованиями</label>
          {existingFilename && !selectedFile && (
            <div className="flex items-center gap-3 mb-2 px-3 py-2 rounded-lg bg-dark-hover border border-dark-border text-sm">
              <svg className="w-4 h-4 text-accent-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-gray-400 flex-1 truncate">{existingFilename}</span>
              <span className="text-xs text-gray-600">Прикреплён</span>
            </div>
          )}
          <div
            className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
              selectedFile
                ? 'border-accent-green/50 bg-accent-green/5'
                : 'border-dark-border hover:border-gray-600'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_EXTS}
              className="hidden"
              onChange={handleFileChange}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5 text-accent-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-white truncate max-w-xs">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="text-gray-600 hover:text-red-400 transition-colors ml-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                <svg className="w-8 h-8 text-gray-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">Нажмите чтобы выбрать файл</p>
                <p className="text-xs text-gray-700">PDF, DOC, DOCX, TXT, изображения, ZIP — до 10 МБ</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                Сохранение…
              </span>
            ) : (
              isEdit ? 'Обновить заказ' : 'Создать заказ'
            )}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/orders')}>Отмена</button>
        </div>
      </form>
    </div>
  );
}

export default OrderForm;
