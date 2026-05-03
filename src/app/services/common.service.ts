import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AcademicMonth } from '../Models/academicmonth';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Fee } from '../Models/fee';
import { FeeType } from '../Models/feetype';
import { DueBalance } from '../Models/due-balance';
import { MonthlyPayment } from '../Models/monthly-payment';
import { OthersPayment } from '../Models/other-payment';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommonServices {
  private apiUrl = `${environment.apiBaseUrl}/api/`;
  private apiUrl3 = `${environment.apiBaseUrl}/api/Common`;
  private apiUrl2 = `${environment.apiBaseUrl}/api/Common/Frequency`;
  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('JWT_TOKEN') || localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  // GET all academic months (Hardcoded locally since backend table is empty)
  getAllAcademicMonths(): Observable<AcademicMonth[]> {
    const standardMonths: AcademicMonth[] = [
      { monthId: 1, monthName: 'January' },
      { monthId: 2, monthName: 'February' },
      { monthId: 3, monthName: 'March' },
      { monthId: 4, monthName: 'April' },
      { monthId: 5, monthName: 'May' },
      { monthId: 6, monthName: 'June' },
      { monthId: 7, monthName: 'July' },
      { monthId: 8, monthName: 'August' },
      { monthId: 9, monthName: 'September' },
      { monthId: 10, monthName: 'October' },
      { monthId: 11, monthName: 'November' },
      { monthId: 12, monthName: 'December' }
    ];
    return of(standardMonths);
  }
  getAllFees(): Observable<Fee[]> {
    const url = `${this.apiUrl}Fees`;
    return this.http.get<Fee[]>(url, this.getAuthHeaders());
  }

  getAllFeeType(): Observable<FeeType[]> {
    const url = `${this.apiUrl}FeeTypes`;
    return this.http.get<FeeType[]>(url, this.getAuthHeaders());
  }

  getFrequencyEnum(): Observable<string[]> {
    return this.http.get<string[]>(this.apiUrl2, this.getAuthHeaders());
  }

  getAllStudents(): Observable<any[]> {
    const url = `${this.apiUrl}Students`;
    return this.http.get<any[]>(url, this.getAuthHeaders());
  }

  getAllStandards(): Observable<any[]> {
    const url = `${this.apiUrl}Standards`;
    return this.http.get<any[]>(url, this.getAuthHeaders());
  }

  getDueBalance(studentId: number): Observable<DueBalance> {
    return this.http.get<DueBalance>(`${this.apiUrl3}/DueBalances/${studentId}`, this.getAuthHeaders());
  }

  getAllPaymentsByStudentId(studentId: number): Observable<MonthlyPayment[]> {
    return this.http.get<MonthlyPayment[]>(`${this.apiUrl3}/GetAllPaymentByStudentId/${studentId}`, this.getAuthHeaders());
  }

  getAllOtherPaymentsByStudentId(studentId: number): Observable<OthersPayment[]> {
    return this.http.get<OthersPayment[]>(`${this.apiUrl3}/GetAllOtherPaymentByStudentId/${studentId}`, this.getAuthHeaders());
  }

  getAllMonthlyPayments(): Observable<MonthlyPayment[]> {
    return this.http.get<MonthlyPayment[]>(`${this.apiUrl}MonthlyPayments`, this.getAuthHeaders());
  }

  getAllOthersPayments(): Observable<OthersPayment[]> {
    return this.http.get<OthersPayment[]>(`${this.apiUrl}OthersPayments`, this.getAuthHeaders());
  }

  createMonthlyPayment(payment: MonthlyPayment): Observable<MonthlyPayment> {
    return this.http.post<MonthlyPayment>(`${this.apiUrl}MonthlyPayments`, payment, this.getAuthHeaders());
  }

  getfeePaymentDetailsByStudentId(studentId: number): Observable<any> {
    return this.http.get(`${this.apiUrl3}/GetPaymentDetailsByStudentId/${studentId}`);
  }


  private sidebarVisibilitySubject = new BehaviorSubject<boolean>(true);
  sidebarVisibility$ = this.sidebarVisibilitySubject.asObservable();

  toggleSidebar() {
    this.sidebarVisibilitySubject.next(!this.sidebarVisibilitySubject.value);
  }


}
