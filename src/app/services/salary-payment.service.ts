import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SalaryPayment } from '../Models/salary-payment';

@Injectable({
  providedIn: 'root'
})
export class SalaryPaymentService {

  private apiUrl = `${environment.apiBaseUrl}/api/SalaryPayments`;

  constructor(private http: HttpClient) { }

  getAll(): Observable<SalaryPayment[]> {
    return this.http.get<SalaryPayment[]>(this.apiUrl);
  }

  getForStaff(staffId: number): Observable<SalaryPayment[]> {
    return this.http.get<SalaryPayment[]>(`${this.apiUrl}/staff/${staffId}`);
  }

  getById(id: number): Observable<SalaryPayment> {
    return this.http.get<SalaryPayment>(`${this.apiUrl}/${id}`);
  }

  create(payload: any): Observable<SalaryPayment> {
    return this.http.post<SalaryPayment>(this.apiUrl, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
