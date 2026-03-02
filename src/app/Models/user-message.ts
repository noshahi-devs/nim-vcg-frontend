export interface UserMessage {
    id: number;
    senderId: string;
    receiverId: string;
    subject: string;
    content: string;
    isRead: boolean;
    isStarred: boolean;
    isDeletedIn: boolean;
    isDeletedOut: boolean;
    createdAt: string;
}
