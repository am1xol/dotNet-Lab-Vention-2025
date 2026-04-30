import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Notification, NotificationType } from '../types/notification';
import { useAuthStore } from '../store/auth-store';

export const notificationHubEvents = {
  notificationCreated: 'NotificationCreated',
} as const;

type NotificationCreatedHandler = (notification: Notification) => void;

const normalizeNotificationType = (rawType: unknown): NotificationType => {
  if (rawType === 'Info' || rawType === 0 || rawType === '0') return 'Info';
  if (rawType === 'Warning' || rawType === 1 || rawType === '1') return 'Warning';
  if (rawType === 'Error' || rawType === 2 || rawType === '2') return 'Error';
  if (rawType === 'Success' || rawType === 3 || rawType === '3') return 'Success';
  return 'Info';
};

const normalizeNotification = (notification: Notification): Notification => ({
  ...notification,
  type: normalizeNotificationType(notification.type),
});

class NotificationRealtimeService {
  private connection: HubConnection | null = null;
  private readonly createdHandlers = new Set<NotificationCreatedHandler>();

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

  onNotificationCreated(handler: NotificationCreatedHandler): () => void {
    this.createdHandlers.add(handler);
    return () => this.createdHandlers.delete(handler);
  }

  private buildConnection(): HubConnection {
    const apiBaseUrl = import.meta.env.VITE_SUBSCRIPTIONS_API_URL;
    const hubUrl = `${apiBaseUrl}/hubs/notifications`;

    return new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => useAuthStore.getState().accessToken ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
  }

  private registerEventBindings(connection: HubConnection): void {
    connection.on(
      notificationHubEvents.notificationCreated,
      (notification: Notification) => {
        const normalized = normalizeNotification(notification);
        this.createdHandlers.forEach((handler) => handler(normalized));
      }
    );
  }
}

export const notificationRealtimeService = new NotificationRealtimeService();
