export type NotificationType = 'Info' | 'Warning' | 'Error' | 'Success';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}
