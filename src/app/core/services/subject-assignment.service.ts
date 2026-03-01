import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SubjectAssignment {
  subjectAssignmentId: number;
  staffId: number;
  subjectId: number;
  sectionId: number;
  // Navigation properties for display
  staff?: any;
  subject?: any;
  section?: any;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectAssignmentService {

  private apiUrl = `${environment.apiBaseUrl}/api/SubjectAssignments`; // Update to match your actual environment base URL

  constructor(private http: HttpClient) { }

  getAllAssignments(): Observable<SubjectAssignment[]> {
    return this.http.get<SubjectAssignment[]>(this.apiUrl);
  }

  // Alias for backward compatibility
  getSubjectAssignments(): Observable<SubjectAssignment[]> {
    return this.getAllAssignments();
  }

  getAssignmentById(id: number): Observable<SubjectAssignment> {
    return this.http.get<SubjectAssignment>(`${this.apiUrl}/${id}`);
  }

  getAssignmentsBySection(sectionId: number): Observable<SubjectAssignment[]> {
    return this.http.get<SubjectAssignment[]>(`${this.apiUrl}/BySection/${sectionId}`);
  }

  getAssignmentsByTeacher(teacherId: number): Observable<SubjectAssignment[]> {
    return this.http.get<SubjectAssignment[]>(`${this.apiUrl}/ByTeacher/${teacherId}`);
  }

  addAssignment(assignment: SubjectAssignment): Observable<SubjectAssignment> {
    return this.http.post<SubjectAssignment>(this.apiUrl, assignment);
  }

  // Alias for backward compatibility
  assignSubject(assignment: SubjectAssignment): Observable<SubjectAssignment> {
    return this.addAssignment(assignment);
  }

  updateAssignment(id: number, assignment: SubjectAssignment): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, assignment);
  }

  deleteAssignment(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
