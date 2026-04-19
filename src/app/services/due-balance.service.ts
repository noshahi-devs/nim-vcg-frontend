import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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
    private apiUrl = `${environment.apiBaseUrl}/api/DueBalances`;

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('JWT_TOKEN') || localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getDueBalances(): Observable<DueBalance[]> {
        console.log('📡 DueBalanceService: API URL =', this.apiUrl);
        return this.http.get<DueBalance[]>(this.apiUrl, this.getAuthHeaders()).pipe(
            tap(data => console.log('✅ DueBalanceService: Data Received:', data)),
            catchError(error => {
                console.error('❌ DueBalanceService: Fetch Error:', error);
                return of([]);
            })
        );
    }

    syncDueBalances(): Observable<any> {
        return this.http.post(`${this.apiUrl}/sync`, {}, this.getAuthHeaders()).pipe(
            tap(res => console.log('🔄 DueBalanceService: Sync successful', res)),
            catchError(error => {
                console.error('❌ DueBalanceService: Sync Error', error);
                throw error;
            })
        );
    }
}


