import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../Models/notification';

export interface NotificationLog {
    id: number;
    title: string;
    message: string;
    notificationType: string;
    createdAt: string;
    isRead: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = 'http://localhost:5257/api/Notifications';

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getNotifications(): Observable<Notification[]> {
        return this.http.get<Notification[]>(this.apiUrl, this.getAuthHeaders());
    }

    markAsRead(id: number): Observable<any> {
        const url = `${this.apiUrl}/${id}/read`;
        return this.http.patch(url, {}, this.getAuthHeaders());
    }

    broadcast(notification: Partial<Notification>): Observable<any> {
        const url = `${this.apiUrl}/broadcast`;
        return this.http.post(url, notification, this.getAuthHeaders());
    }

    getLogs(): Observable<NotificationLog[]> {
        const url = `${this.apiUrl}/logs`;
        return this.http.get<NotificationLog[]>(url, this.getAuthHeaders());
    }
}
