import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeductionSuggestion, PayrollDeductionRule } from '../Models/payroll-deduction-rule';

@Injectable({
  providedIn: 'root'
})
export class PayrollDeductionRuleService {

  private apiUrl = `${environment.apiBaseUrl}/api/PayrollDeductionRules`;

  constructor(private http: HttpClient) { }

  getRule(): Observable<PayrollDeductionRule> {
    return this.http.get<PayrollDeductionRule>(this.apiUrl);
  }

  updateRule(rule: PayrollDeductionRule): Observable<PayrollDeductionRule> {
    return this.http.put<PayrollDeductionRule>(this.apiUrl, rule);
  }

  calculateSuggestion(staffId: number, startDate: string, endDate: string): Observable<DeductionSuggestion> {
    return this.http.get<DeductionSuggestion>(
      `${this.apiUrl}/CalculateSuggestion?staffId=${staffId}&startDate=${startDate}&endDate=${endDate}`
    );
  }
}
