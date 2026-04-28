import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { ChatMessageDto } from '../types/chat';
import { useAuthStore } from '../store/auth-store';

export const chatHubEvents = {
  conversationUpdated: 'ConversationUpdated',
  messageReceived: 'MessageReceived',
  unreadCountChanged: 'UnreadCountChanged',
} as const;

type MessageHandler = (message: ChatMessageDto) => void;
type ConversationHandler = (conversationId: string) => void;
type UnreadCountHandler = (count: number) => void;

class ChatRealtimeService {
  private connection: HubConnection | null = null;
  private readonly messageHandlers = new Set<MessageHandler>();
  private readonly conversationHandlers = new Set<ConversationHandler>();
  private readonly unreadCountHandlers = new Set<UnreadCountHandler>();

  async connect(): Promise<void> {
    if (!this.connection) {
      this.connection = this.buildConnection();
      this.registerEventBindings(this.connection);
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      await this.connection.start();
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    if (this.connection.state !== HubConnectionState.Disconnected) {
      await this.connection.stop();
    }
  }

  isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  onMessageReceived(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConversationUpdated(handler: ConversationHandler): () => void {
    this.conversationHandlers.add(handler);
    return () => this.conversationHandlers.delete(handler);
  }

  onUnreadCountChanged(handler: UnreadCountHandler): () => void {
    this.unreadCountHandlers.add(handler);
    return () => this.unreadCountHandlers.delete(handler);
  }

  private buildConnection(): HubConnection {
    const apiBaseUrl = import.meta.env.VITE_AUTH_API_URL;
    const hubUrl = `${apiBaseUrl}/hubs/chat`;

    return new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
  }

  private registerEventBindings(connection: HubConnection): void {
    connection.on(chatHubEvents.messageReceived, (message: ChatMessageDto) => {
      this.messageHandlers.forEach((handler) => handler(message));
    });

    connection.on(chatHubEvents.conversationUpdated, (conversationId: string) => {
      this.conversationHandlers.forEach((handler) => handler(conversationId));
    });

    connection.on(chatHubEvents.unreadCountChanged, (count: number) => {
      this.unreadCountHandlers.forEach((handler) => handler(count));
    });
  }
}

export const chatRealtimeService = new ChatRealtimeService();
