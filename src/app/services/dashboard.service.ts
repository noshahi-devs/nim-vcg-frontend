import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DashboardStats {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    incomeThisMonth: number;
    expenseThisMonth: number;
}

@Injectable({
    providedIn: 'root'
})
export class DashboardService {

    private apiUrl = 'https://localhost:7225/api/Dashboard';

    constructor(private http: HttpClient) { }

    // Helper function to add token header
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, this.getAuthHeaders());
    }
}
