import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Shift } from '../Models/shift';

@Injectable({
  providedIn: 'root'
})
export class ShiftService {

  private apiUrl = `${environment.apiBaseUrl}/api/Shifts`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<Shift[]> {
    return this.http.get<Shift[]>(this.apiUrl);
  }

  getById(id: number): Observable<Shift> {
    return this.http.get<Shift>(`${this.apiUrl}/${id}`);
  }

  create(payload: any): Observable<Shift> {
    return this.http.post<Shift>(this.apiUrl, payload);
  }

  update(id: number, payload: any): Observable<Shift> {
    return this.http.put<Shift>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
