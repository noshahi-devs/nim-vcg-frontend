import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Holiday } from '../Models/holiday';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {

  private apiUrl = `${environment.apiBaseUrl}/api/Holidays`;

  constructor(private http: HttpClient) { }

  getAll(year?: number): Observable<Holiday[]> {
    const query = year ? `?year=${year}` : '';
    return this.http.get<Holiday[]>(`${this.apiUrl}${query}`);
  }

  create(holiday: Holiday): Observable<Holiday> {
    return this.http.post<Holiday>(this.apiUrl, holiday);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
