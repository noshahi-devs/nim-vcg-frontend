import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { StaffSalary } from '../Models/staff-salary';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StaffSalaryService {

  private apiUrl = 'http://localhost:5257/api/StaffSalaries';

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  // Method to fetch all staff salaries
  getStaffSalaries(): Observable<StaffSalary[]> {
    return this.http.get<StaffSalary[]>(this.apiUrl, this.getAuthHeaders());
  }

  // Method to fetch a specific staff salary by ID
  getStaffSalaryById(id: number): Observable<StaffSalary> {
    return this.http.get<StaffSalary>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  // Method to add a new staff salary
  addStaffSalary(staffSalary: StaffSalary): Observable<StaffSalary> {
    return this.http.post<StaffSalary>(this.apiUrl, staffSalary, this.getAuthHeaders());
  }

  // Method to update an existing staff salary
  updateStaffSalary(id: number, staffSalary: StaffSalary): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, staffSalary, this.getAuthHeaders());
  }

  // Method to delete a staff salary
  deleteStaffSalary(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
