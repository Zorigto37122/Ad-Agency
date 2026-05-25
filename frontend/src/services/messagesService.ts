import api from './api';

export interface MessageCreate {
  subject: string;
  body: string;
}

export interface Message {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  subject: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export const messagesService = {
  async send(data: MessageCreate): Promise<Message> {
    const { data: res } = await api.post<Message>('/api/messages', data);
    return res;
  },

  async list(): Promise<Message[]> {
    const { data } = await api.get<Message[]>('/api/messages');
    return data;
  },

  async unreadCount(): Promise<number> {
    const { data } = await api.get<{ count: number }>('/api/messages/unread-count');
    return data.count;
  },

  async markRead(id: number): Promise<Message> {
    const { data } = await api.patch<Message>(`/api/messages/${id}/read`);
    return data;
  },
};
