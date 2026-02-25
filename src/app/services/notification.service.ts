import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificationLog {
    id: number;
    recipientEmail: string;
    recipientName: string;
    subject: string;
    notificationType: string;
    status: string;
    errorMessage?: string;
    createdAt: string;
    sentAt?: string;
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

    getLogs(): Observable<NotificationLog[]> {
        return this.http.get<NotificationLog[]>(`${this.apiUrl}/logs`, this.getAuthHeaders());
    }

    sendCustomEmail(request: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/send-custom`, request, this.getAuthHeaders());
    }

    testConnection(): Observable<any> {
        return this.http.post(`${this.apiUrl}/test-connection`, {}, this.getAuthHeaders());
    }
}
