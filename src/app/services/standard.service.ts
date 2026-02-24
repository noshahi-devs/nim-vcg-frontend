import { Injectable } from '@angular/core';
import { Standard } from '../Models/standard';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class StandardService {

  private apiUrl = 'http://localhost:5257/api/Standards';

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // --------------------------- GET ALL ---------------------------
  getStandards(): Observable<Standard[]> {
    return this.http.get<Standard[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  // --------------------------- GET BY ID ---------------------------
  getStandardById(id: number): Observable<Standard> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Standard>(url, {
      headers: this.getAuthHeaders()
    });
  }

  // --------------------------- CREATE ---------------------------
  createStandard(standard: Standard): Observable<Standard> {
    return this.http.post<Standard>(this.apiUrl, standard, {
      headers: this.getAuthHeaders()
    });
  }

  // --------------------------- UPDATE ---------------------------
  updateStandard(standard: Standard): Observable<Standard> {
    const url = `${this.apiUrl}/${standard.standardId}`;
    return this.http.put<Standard>(url, standard, {
      headers: this.getAuthHeaders()
    });
  }

  // --------------------------- DELETE ---------------------------
  deleteStandard(id: number): Observable<Standard> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<Standard>(url, {
      headers: this.getAuthHeaders()
    });
  }
}
