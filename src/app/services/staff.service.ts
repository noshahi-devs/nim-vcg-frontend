import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Staff } from '../Models/staff';

/*const baseUrl: string = "http://localhost:5257/api/Staffs";*/

@Injectable({
  providedIn: 'root'
})
export class StaffService {
  private apiUrl = 'http://localhost:5257/api/Staffs';
  //getAllDepartments: any;
  //getStaffSalaries: any;

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  // GET all staffs
  getAllStaffs(): Observable<Staff[]> {
    return this.http.get<Staff[]>(this.apiUrl, this.getAuthHeaders());
  }

  // GET staff by ID
  getStaffById(id: number): Observable<Staff> {
    return this.http.get<Staff>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  // GET staff by email
  getStaffByEmail(email: string): Observable<Staff> {
    return this.http.get<Staff>(`${this.apiUrl}/ByEmail/${email}`, this.getAuthHeaders());
  }

  // POST a new staff
  addStaff(staff: Staff): Observable<Staff> {
    return this.http.post<Staff>(this.apiUrl, staff, this.getAuthHeaders());
  }

  // PUT update an existing staff
  updateStaff(id: number, staff: Staff): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, staff, this.getAuthHeaders());
  }

  // DELETE a staff
  deleteStaff(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
