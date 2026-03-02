import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserMessage } from '../Models/user-message';

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private apiUrl = 'http://localhost:5257/api/UserMessages';

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getInbox(): Observable<UserMessage[]> {
        return this.http.get<UserMessage[]>(`${this.apiUrl}/inbox`, this.getAuthHeaders());
    }

    getSent(): Observable<UserMessage[]> {
        return this.http.get<UserMessage[]>(`${this.apiUrl}/sent`, this.getAuthHeaders());
    }

    sendMessage(message: Partial<UserMessage>): Observable<UserMessage> {
        return this.http.post<UserMessage>(this.apiUrl, message, this.getAuthHeaders());
    }

    toggleStar(id: number): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/star`, {}, this.getAuthHeaders());
    }

    markAsRead(id: number): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/read`, {}, this.getAuthHeaders());
    }

    deleteMessage(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders());
    }
}
