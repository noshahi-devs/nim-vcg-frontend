import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Campus } from '../Models/campus';

@Injectable({
    providedIn: 'root'
})
export class CampusService {
    private apiUrl = 'http://localhost:5257/api/Campuses';

    private currentCampusSubject = new BehaviorSubject<Campus | null>(null);
    public currentCampus$ = this.currentCampusSubject.asObservable();

    constructor(private http: HttpClient) {
        const savedCampus = localStorage.getItem('selectedCampus');
        if (savedCampus) {
            this.currentCampusSubject.next(JSON.parse(savedCampus));
        }
    }

    private getAuthHeaders() {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            Authorization: `Bearer ${token}`
        });
    }

    getCampuses(): Observable<Campus[]> {
        return this.http.get<Campus[]>(this.apiUrl, {
            headers: this.getAuthHeaders()
        });
    }

    getCampusById(id: number): Observable<Campus> {
        return this.http.get<Campus>(`${this.apiUrl}/${id}`, {
            headers: this.getAuthHeaders()
        });
    }

    createCampus(campus: Campus): Observable<Campus> {
        return this.http.post<Campus>(this.apiUrl, campus, {
            headers: this.getAuthHeaders()
        });
    }

    updateCampus(campus: Campus): Observable<void> {
        return this.http.put<void>(`${this.apiUrl}/${campus.campusId}`, campus, {
            headers: this.getAuthHeaders()
        });
    }

    deleteCampus(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`, {
            headers: this.getAuthHeaders()
        });
    }

    // Campus Selection Logic
    setSelectedCampus(campus: Campus) {
        localStorage.setItem('selectedCampus', JSON.stringify(campus));
        this.currentCampusSubject.next(campus);
    }

    getSelectedCampus(): Campus | null {
        return this.currentCampusSubject.value;
    }
}
