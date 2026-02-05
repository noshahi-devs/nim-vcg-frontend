import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Section } from '../Models/section';

@Injectable({
    providedIn: 'root'
})
export class SectionService {
    private apiUrl = 'https://localhost:7225/api/Sections';

    constructor(private http: HttpClient) { }

    getSections(): Observable<Section[]> {
        return this.http.get<Section[]>(this.apiUrl);
    }

    getSection(id: number): Observable<Section> {
        return this.http.get<Section>(`${this.apiUrl}/${id}`);
    }

    createSection(section: Section): Observable<Section> {
        return this.http.post<Section>(this.apiUrl, section);
    }

    updateSection(id: number, section: Section): Observable<any> {
        return this.http.put(`${this.apiUrl}/${id}`, section);
    }

    deleteSection(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }
}
