import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Attendance } from '../Models/attendance';
import { AttList } from '../Models/attlist';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  private apiUrl = 'http://localhost:5257/api/Attendances';

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  getAttendances(): Observable<Attendance[]> {
    return this.http.get<Attendance[]>(this.apiUrl, this.getAuthHeaders());
  }

  getAttendance(id: number): Observable<Attendance> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Attendance>(url, this.getAuthHeaders());
  }

  addAttendance(attendance: Attendance): Observable<Attendance> {
    return this.http.post<Attendance>(this.apiUrl, attendance, this.getAuthHeaders());
  }

  checkOutStaff(attendance: Attendance): Observable<Attendance> {
    return this.http.post<Attendance>(`${this.apiUrl}/CheckOut`, attendance, this.getAuthHeaders());
  }

  getAttendanceListData(attendance: Attendance): Observable<AttList[]> {
    return this.http.get<AttList[]>(this.apiUrl + "/GetList/" + attendance.type, this.getAuthHeaders());
  }

  // Report Methods
  getClassWiseAttendance(classId: number, date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Report/Class/${classId}?date=${date}`, this.getAuthHeaders());
  }

  getStudentAttendanceReport(studentId: number, startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Report/Student/${studentId}?startDate=${startDate}&endDate=${endDate}`, this.getAuthHeaders());
  }

  getStaffAttendanceReport(staffId: number, startDate: string, endDate: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/Report/Staff/${staffId}?startDate=${startDate}&endDate=${endDate}`, this.getAuthHeaders());
  }
}
