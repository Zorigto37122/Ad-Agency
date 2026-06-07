import api from './api';
import { Invoice, Payment, Refund, PaymentPlan } from '../types';

export const paymentsService = {
  async listInvoices(params?: { order_id?: number; status?: string }): Promise<Invoice[]> {
    const { data } = await api.get<Invoice[]>('/api/invoices', { params });
    return data;
  },

  async getInvoice(id: number): Promise<Invoice> {
    const { data } = await api.get<Invoice>(`/api/invoices/${id}`);
    return data;
  },

  async createInvoice(payload: { order_id: number; issue_date: string; due_date: string; amount: number; notes?: string }): Promise<Invoice> {
    const { data } = await api.post<Invoice>('/api/invoices', payload);
    return data;
  },

  async updateInvoice(id: number, payload: Partial<{ due_date: string; amount: number; status: string; notes: string }>): Promise<Invoice> {
    const { data } = await api.put<Invoice>(`/api/invoices/${id}`, payload);
    return data;
  },

  async removeInvoice(id: number): Promise<void> {
    await api.delete(`/api/invoices/${id}`);
  },

  async addPayment(invoiceId: number, payload: { payment_date: string; amount: number; method: string; currency?: string; transaction_ref?: string }): Promise<Payment> {
    const { data } = await api.post<Payment>(`/api/invoices/${invoiceId}/payments`, payload);
    return data;
  },

  async updatePayment(invoiceId: number, paymentId: number, payload: Partial<{ status: string; transaction_ref: string }>): Promise<Payment> {
    const { data } = await api.put<Payment>(`/api/invoices/${invoiceId}/payments/${paymentId}`, payload);
    return data;
  },

  async createRefund(invoiceId: number, paymentId: number, payload: { amount: number; reason: string }): Promise<Refund> {
    const { data } = await api.post<Refund>(`/api/invoices/${invoiceId}/payments/${paymentId}/refund`, payload);
    return data;
  },

  async createPaymentPlan(invoiceId: number, payload: { installments: number; first_due_date: string }): Promise<PaymentPlan[]> {
    const { data } = await api.post<PaymentPlan[]>(`/api/invoices/${invoiceId}/payment-plan`, payload);
    return data;
  },

  async initiatePayment(invoiceId: number, installmentId?: number): Promise<{ payment_id: number; confirmation_token: string }> {
    const { data } = await api.post<{ payment_id: number; confirmation_token: string }>(`/api/invoices/${invoiceId}/pay`, {
      installment_id: installmentId,
      return_url: window.location.href,
    });
    return data;
  },
};
