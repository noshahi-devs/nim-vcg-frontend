import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface User {
    id: string;
    userName: string;
    email: string;
    phoneNumber?: string;
    role?: string[];
    campus?: string;
    status?: string;
    createdOn?: string;
}

export interface RegisterRequest {
    Username: string;
    Email: string;
    Password: string;
    Role: string[];
}

@Injectable({
    providedIn: 'root'
})
export class UserManagementService {
    private apiUrl = 'http://localhost:5257/api/Users';

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>('http://localhost:5257/GetUsers', this.getAuthHeaders());
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
        return this.http.get<any[]>('http://localhost:5257/GetRoles', this.getAuthHeaders());
    }
}
