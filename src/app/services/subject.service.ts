import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from '../Models/subject';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  getSubjectsByStandard(selectedStandardId: number) {
    throw new Error('Method not implemented.');
  }

  private apiUrl = 'https://localhost:7225/api/Subjects';

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  // Get all subjects
  getSubjects(): Observable<Subject[]> {
    return this.http.get<Subject[]>(this.apiUrl, this.getAuthHeaders());
  }

  // Retrieve a specific subject by ID
  getSubjectById(id: number): Observable<Subject> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Subject>(url, this.getAuthHeaders());
  }

  // Create a new subject
  createSubject(subject: Subject): Observable<Subject> {
    return this.http.post<Subject>(this.apiUrl, subject, this.getAuthHeaders());
  }

  // Update an existing subject
  updateSubject(subject: Subject): Observable<Subject> {
    const url = `${this.apiUrl}/${subject.subjectId}`;
    return this.http.put<Subject>(url, subject, this.getAuthHeaders());
  }

  // Delete a subject
  deleteSubject(id: number): Observable<Subject> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<Subject>(url, this.getAuthHeaders());
  }
}
