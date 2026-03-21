export interface ChatConversationDto {
  id: string;
  userId: string;
  adminId: string | null;
  status: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  userFirstName?: string;
  userLastName?: string;
  userEmail?: string;
  unreadCount: number;
}

export interface ChatMessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  senderFirstName?: string;
  senderLastName?: string;
}

export interface ChatWithUserDto {
  conversation: ChatConversationDto;
  messages: ChatMessageDto[];
}

export interface SendMessageRequest {
  content: string;
}