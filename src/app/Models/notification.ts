export interface Notification {
    id: number;
    userId: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
    notificationType?: string;
}
