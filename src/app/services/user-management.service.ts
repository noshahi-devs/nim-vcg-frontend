import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
    id: string;
    userName: string;
    email: string;
    phoneNumber?: string;
    role?: string[];
    status?: string;
    createdOn?: string;
}

export interface RegisterRequest {
    Username: string;
    Email: string;
    Password: string;
    Role: string[];
    PhoneNumber?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserManagementService {
    private apiUrl = `${environment.apiBaseUrl}/api/Users`;

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('JWT_TOKEN') || localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/GetUsers`, this.getAuthHeaders());
    }

    registerUser(user: RegisterRequest): Observable<any> {
        return this.http.post(`${this.apiUrl}/register`, user, this.getAuthHeaders());
    }

    deleteUser(userId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/delete-user/${userId}`, this.getAuthHeaders());
    }

    assignRole(model: { id: string, role: string[] }): Observable<any> {
        return this.http.post(`${this.apiUrl}/AssignRole`, model, this.getAuthHeaders());
    }

    getAllRoles(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/GetRoles`, this.getAuthHeaders());
    }

    toggleUserStatus(userId: string, status: string): Observable<any> {
        return this.http.put(`${this.apiUrl}/toggle-status/${userId}`, { status }, this.getAuthHeaders());
    }
}
