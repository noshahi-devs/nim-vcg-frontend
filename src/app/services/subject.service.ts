import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Subject } from '../Models/subject';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  getSubjectsByStandard(selectedStandardId: number): Observable<Subject[]> {
    return this.getSubjects().pipe(
      map(subjects => subjects.filter(s =>
        s.standardId === selectedStandardId ||
        s.standard?.standardId === selectedStandardId
      ))
    );
  }

  private apiUrl = `${environment.apiBaseUrl}/api/Subjects`;

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('JWT_TOKEN') || localStorage.getItem('token');
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
