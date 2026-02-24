import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Leave, LeaveStatusUpdate } from '../Models/leave';

@Injectable({
    providedIn: 'root'
})
export class LeaveService {
    private apiUrl = 'http://localhost:5257/api/Leaves';

    constructor(private http: HttpClient) { }

    getLeaves(): Observable<Leave[]> {
        return this.http.get<Leave[]>(this.apiUrl);
    }

    getLeave(id: number): Observable<Leave> {
        return this.http.get<Leave>(`${this.apiUrl}/${id}`);
    }

    getStaffLeaves(staffId: number): Observable<Leave[]> {
        return this.http.get<Leave[]>(`${this.apiUrl}/staff/${staffId}`);
    }

    createLeave(leave: Leave): Observable<Leave> {
        return this.http.post<Leave>(this.apiUrl, leave);
    }

    updateLeave(id: number, leave: Leave): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, leave);
    }

    updateLeaveStatus(id: number, update: LeaveStatusUpdate): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/status`, update);
    }

    deleteLeave(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
