import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AcademicYear } from '../Models/academic-year';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AcademicYearService {
    private apiUrl = `${environment.apiBaseUrl}/api/AcademicYears`;

    constructor(private http: HttpClient) { }

    private getAuthHeaders() {
        const token = localStorage.getItem('JWT_TOKEN') || localStorage.getItem('token');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    getAcademicYears(): Observable<AcademicYear[]> {
        return this.http.get<AcademicYear[]>(this.apiUrl, {
            headers: this.getAuthHeaders()
        });
    }

    getAcademicYearById(id: number): Observable<AcademicYear> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.get<AcademicYear>(url, {
            headers: this.getAuthHeaders()
        });
    }

    createAcademicYear(academicYear: AcademicYear): Observable<AcademicYear> {
        return this.http.post<AcademicYear>(this.apiUrl, academicYear, {
            headers: this.getAuthHeaders()
        });
    }

    updateAcademicYear(academicYear: AcademicYear): Observable<void> {
        const url = `${this.apiUrl}/${academicYear.academicYearId}`;
        return this.http.put<void>(url, academicYear, {
            headers: this.getAuthHeaders()
        });
    }

    deleteAcademicYear(id: number): Observable<void> {
        const url = `${this.apiUrl}/${id}`;
        return this.http.delete<void>(url, {
            headers: this.getAuthHeaders()
        });
    }
}
