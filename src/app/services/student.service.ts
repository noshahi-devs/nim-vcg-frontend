import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Student } from '../Models/student';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StudentService {

  constructor(private http: HttpClient) { }

  apiUrl: string = "https://localhost:7225/api/Students";

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  public GetStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(this.apiUrl, this.getAuthHeaders());
  }

  public GetStudent(id: number): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }

  public SaveStudent(student: Student): Observable<Student> {
    return this.http.post<Student>(this.apiUrl, student, this.getAuthHeaders());
  }

  public UpdateStudent(student: Student): Observable<Student> {
    return this.http.put<Student>(`${this.apiUrl}/${student.studentId}`, student, this.getAuthHeaders());
  }

  public DeleteStudent(id: any): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders());
  }
}
