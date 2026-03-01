import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SubjectAssignment } from '../Models/subject-assignment';

@Injectable({
    providedIn: 'root'
})
export class SubjectAssignmentService {
    private apiUrl = 'http://localhost:5257/api/SubjectAssignments';

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    getSubjectAssignments(): Observable<SubjectAssignment[]> {
        return this.http.get<SubjectAssignment[]>(this.apiUrl, this.getAuthHeaders());
    }

    getAssignmentsByTeacher(staffId: number): Observable<SubjectAssignment[]> {
        return this.http.get<SubjectAssignment[]>(`${this.apiUrl}/ByTeacher/${staffId}`, this.getAuthHeaders());
    }

    getAssignmentsBySection(sectionId: number): Observable<SubjectAssignment[]> {
        return this.http.get<SubjectAssignment[]>(`${this.apiUrl}/BySection/${sectionId}`, this.getAuthHeaders());
    }

    assignSubject(assignment: SubjectAssignment): Observable<SubjectAssignment> {
        return this.http.post<SubjectAssignment>(this.apiUrl, assignment, this.getAuthHeaders());
    }

    deleteAssignment(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`, this.getAuthHeaders());
    }
}
