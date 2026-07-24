export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string | null;
  read: boolean;
  createdAt: string;
}
