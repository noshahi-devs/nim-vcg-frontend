import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LeaveTypeMaster {
    leaveTypeMasterId: number;
    leaveTypeName: string;
    description?: string;
    maxDaysAllowed: number;
    isPaid: boolean;
    isActive: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class LeaveTypeService {
    private apiUrl = 'http://localhost:5257/api/LeaveTypes';

    constructor(private http: HttpClient) { }

    // Helper function to add token header
    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getLeaveTypes(): Observable<LeaveTypeMaster[]> {
        return this.http.get<LeaveTypeMaster[]>(this.apiUrl, this.getAuthHeaders());
    }

    getLeaveType(id: number): Observable<LeaveTypeMaster> {
        return this.http.get<LeaveTypeMaster>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
    }

    createLeaveType(leaveType: LeaveTypeMaster): Observable<LeaveTypeMaster> {
        return this.http.post<LeaveTypeMaster>(this.apiUrl, leaveType, this.getAuthHeaders());
    }

    updateLeaveType(id: number, leaveType: LeaveTypeMaster): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${id}`, leaveType, this.getAuthHeaders());
    }

    deleteLeaveType(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
    }
}

