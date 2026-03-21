import api from './api';
import { ChatConversationDto, ChatMessageDto, ChatWithUserDto, SendMessageRequest } from '../types/chat';

export const chatService = {
  getMyConversation: async (): Promise<ChatWithUserDto> => {
    const response = await api.get<ChatWithUserDto>('/api/chat/conversation');
    return response.data;
  },

  sendMessage: async (content: string): Promise<ChatMessageDto> => {
    const request: SendMessageRequest = { content };
    const response = await api.post<ChatMessageDto>('/api/chat/messages', request);
    return response.data;
  },

  getAllConversations: async (status?: string): Promise<ChatConversationDto[]> => {
    const params = status ? { status } : {};
    const response = await api.get<ChatConversationDto[]>('/api/chat/conversations', { params });
    return response.data;
  },

  getConversationById: async (id: string): Promise<ChatWithUserDto> => {
    const response = await api.get<ChatWithUserDto>(`/api/chat/conversations/${id}`);
    return response.data;
  },

  adminSendMessage: async (conversationId: string, content: string): Promise<ChatMessageDto> => {
    const request: SendMessageRequest = { content };
    const response = await api.post<ChatMessageDto>(`/api/chat/conversations/${conversationId}/messages`, request);
    return response.data;
  },

  closeConversation: async (id: string): Promise<void> => {
    await api.put(`/api/chat/conversations/${id}/close`);
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await api.get<number>('/api/chat/unread');
    return response.data;
  },

  markAsRead: async (): Promise<void> => {
    await api.put('/api/chat/conversation/read');
  },

  createNewConversation: async (): Promise<ChatWithUserDto> => {
    const response = await api.post<ChatWithUserDto>('/api/chat/conversation/new');
    return response.data;
  },
};

export default chatService;