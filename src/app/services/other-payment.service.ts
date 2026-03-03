import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { OthersPayment } from '../Models/other-payment';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OtherPaymentService {

  private apiUrl = `${environment.apiBaseUrl}/api/OthersPayments`;

  constructor(private http: HttpClient) { }

  getOtherPayments(): Observable<OthersPayment[]> {
    return this.http.get<OthersPayment[]>(this.apiUrl);
  }


  getOtherPayemtnById(id: number): Observable<OthersPayment> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<OthersPayment>(url);
  }

  // Create a new fee type
  createOthersPayment(OthersPayment: OthersPayment): Observable<OthersPayment> {
    return this.http.post<OthersPayment>(this.apiUrl, OthersPayment);
  }




  // Update an existing fee type
  updateOthersPayment(OthersPayment: OthersPayment): Observable<OthersPayment> {
    const url = `${this.apiUrl}/${OthersPayment.othersPaymentId}`;
    return this.http.put<OthersPayment>(url, OthersPayment);
  }

  // Delete a fee type
  deleteOthersPayment(id: number): Observable<OthersPayment> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.delete<OthersPayment>(url);
  }
}
