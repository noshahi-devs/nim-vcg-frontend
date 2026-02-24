import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface DueBalance {
    dueBalanceId: number;
    studentId: number;
    dueBalanceAmount: number;
    lastUpdate: string;
    student?: {
        studentId: number;
        studentName: string;
        standard?: {
            standardId: number;
            standardName: string;
        }
    }
}

@Injectable({
    providedIn: 'root'
})
export class DueBalanceService {
    private apiUrl = 'http://localhost:5257/api/DueBalances';

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getDueBalances(): Observable<DueBalance[]> {
        return this.http.get<DueBalance[]>(this.apiUrl, this.getAuthHeaders());
    }
}
