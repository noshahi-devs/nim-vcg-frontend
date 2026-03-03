import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StudentStats {
    attendancePercentage: number;
    totalPaid: number;
    totalDue: number;
    recentMarks: any[];
    nextExam: any;
    studentInfo: {
        name: string;
        className: string;
        admissionNo: number;
        enrollmentNo: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class StudentDashboardService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiBaseUrl}/api/StudentDashboard`;

    getStudentStats(studentId: number): Observable<StudentStats> {
        return this.http.get<StudentStats>(`${this.apiUrl}/stats/${studentId}`);
    }

    getAttendanceHistory(studentId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/attendance-history/${studentId}`);
    }
}
