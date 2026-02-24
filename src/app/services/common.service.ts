import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AcademicMonth } from '../Models/academicmonth';
import { BehaviorSubject, Observable } from 'rxjs';
import { Fee } from '../Models/fee';
import { FeeType } from '../Models/feetype';
import { DueBalance } from '../Models/due-balance';
import { MonthlyPayment } from '../Models/monthly-payment';
import { OthersPayment } from '../Models/other-payment';

@Injectable({
  providedIn: 'root'
})
export class CommonServices {
  private apiUrl = 'http://localhost:5257/api/';
  private apiUrl3 = 'http://localhost:5257/api/Common';
  private apiUrl2 = 'http://localhost:5257/api/Common/Frequency';
  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  // GET all academic months
  getAllAcademicMonths(): Observable<AcademicMonth[]> {
    const url = `${this.apiUrl}AcademicMonths`;
    return this.http.get<AcademicMonth[]>(url, this.getAuthHeaders());
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
    return this.http.get<DueBalance>(`http://localhost:5257/api/Common/DueBalances/${studentId}`, this.getAuthHeaders());
  }

  getAllPaymentsByStudentId(studentId: number): Observable<MonthlyPayment[]> {
    return this.http.get<MonthlyPayment[]>(`${this.apiUrl3}/GetAllPaymentByStudentId/${studentId}`, this.getAuthHeaders());
  }

  getAllOtherPaymentsByStudentId(studentId: number): Observable<OthersPayment[]> {
    return this.http.get<OthersPayment[]>(`${this.apiUrl3}/GetAllOtherPaymentByStudentId/${studentId}`, this.getAuthHeaders());
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
