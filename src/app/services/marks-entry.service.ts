import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MarksEntry, StudentMarksDetails } from '../Models/marks-entry';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MarkEntryService {

  private apiBaseUrl = 'http://localhost:5257/api/MarkEntry';

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  getAllMarkEntries(): Observable<MarksEntry[]> {
    return this.http.get<MarksEntry[]>(`${this.apiBaseUrl}`, this.getAuthHeaders());
  }

  getMarkEntryById(id: number): Observable<MarksEntry> {
    return this.http.get<MarksEntry>(`${this.apiBaseUrl}/${id}`, this.getAuthHeaders());
  }

  GetStudents(markEntry: MarksEntry): Observable<StudentMarksDetails[]> {
    return this.http.post<StudentMarksDetails[]>(`${this.apiBaseUrl}/GetStudents`, markEntry, this.getAuthHeaders());
  }

  createMarkEntry(markEntry: MarksEntry): Observable<MarksEntry> {
    return this.http.post<MarksEntry>(`${this.apiBaseUrl}`, markEntry, this.getAuthHeaders());
  }

  updateMarkEntry(markEntry: MarksEntry): Observable<MarksEntry> {
    return this.http.put<MarksEntry>(`${this.apiBaseUrl}`, markEntry, this.getAuthHeaders());
  }

  deleteMarkEntry(id: number): Observable<any> {
    return this.http.delete(`${this.apiBaseUrl}/${id}`, this.getAuthHeaders());
  }
}
