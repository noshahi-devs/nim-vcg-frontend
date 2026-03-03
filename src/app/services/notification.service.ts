import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Notification } from '../Models/notification';
import { environment } from '../../environments/environment';

export interface NotificationLog {
    id: number;
    title: string;
    message: string;
    notificationType: string;
    createdAt: string;
    isRead: boolean;
    recipientName?: string;
    recipientEmail?: string;
    status?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = `${environment.apiBaseUrl}/api/Notifications`;

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('JWT_TOKEN');
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

    broadcast(notification: Partial<Notification> & { targetRoles?: string[], targetSectionIds?: number[], targetSubjectIds?: number[] }): Observable<any> {
        const url = `${this.apiUrl}/broadcast`;
        return this.http.post(url, notification, this.getAuthHeaders());
    }

    getMySections(): Observable<any[]> {
        const url = `${this.apiUrl}/my-sections`;
        return this.http.get<any[]>(url, this.getAuthHeaders());
    }

    getMyAssignments(): Observable<any[]> {
        const url = `${this.apiUrl}/my-sections`; // The backend still uses my-sections but returns assignments
        return this.http.get<any[]>(url, this.getAuthHeaders());
    }

    getLogs(): Observable<NotificationLog[]> {
        const url = `${this.apiUrl}/logs`;
        return this.http.get<NotificationLog[]>(url, this.getAuthHeaders());
    }
}
