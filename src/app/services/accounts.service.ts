import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface Income {
  id: number;
  date: string;
  source: string;
  description: string;
  amount: number;
  paymentMethod: string;
  receivedBy: string;
  campus: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  date: string;
  expenseType: string;
  description: string;
  amount: number;
  paymentMethod: string;
  paidTo: string;
  approvedBy: string;
  campus: string;
  createdAt: string;
}

export interface Transaction {
  id: number;
  date: string;
  transactionId: string;
  type: string;
  category: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ProfitLossReport {
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  incomeByCategory: { category: string; amount: number }[];
  expenseByCategory: { category: string; amount: number }[];
}

export interface DashboardData {
  chartData: {
    months: string[];
    income: number[];
    expenses: number[];
  };
  totalIncome: number;
  totalExpenses: number;
  profitLoss: number;
  cashBankBalance: number;
  recentTransactions: Transaction[];
}

// Triggering recompile to pick up recentTransactions changes
@Injectable({ providedIn: 'root' })
export class AccountsService {

  private apiUrl = 'http://localhost:5257/api';

  constructor(private http: HttpClient) { }

  // Helper function to add token header
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  }

  // Income Management
  getIncomeList(): Observable<Income[]> {
    return this.http.get<Income[]>(`${this.apiUrl}/GeneralIncomes`, this.getAuthHeaders());
  }

  addIncome(income: Partial<Income>): Observable<Income> {
    return this.http.post<Income>(`${this.apiUrl}/GeneralIncomes`, income, this.getAuthHeaders());
  }

  updateIncome(id: number, income: Partial<Income>): Observable<Income> {
    return this.http.put<Income>(`${this.apiUrl}/GeneralIncomes/${id}`, income, this.getAuthHeaders());
  }

  deleteIncome(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/GeneralIncomes/${id}`, this.getAuthHeaders());
  }

  // Expense Management
  getExpenses(): Observable<Expense[]> {
    return this.http.get<Expense[]>(`${this.apiUrl}/GeneralExpenses`, this.getAuthHeaders());
  }

  addExpense(expense: Partial<Expense>): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/GeneralExpenses`, expense, this.getAuthHeaders());
  }

  updateExpense(id: number, expense: Partial<Expense>): Observable<Expense> {
    return this.http.put<Expense>(`${this.apiUrl}/GeneralExpenses/${id}`, expense, this.getAuthHeaders());
  }

  deleteExpense(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/GeneralExpenses/${id}`, this.getAuthHeaders());
  }

  // Ledger: Now fetched from backend for accuracy
  getLedger(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/Accounts/ledger`, this.getAuthHeaders());
  }

  // Profit & Loss Report: Now fetched from backend
  getProfitLossReport(startDate: string, endDate: string, campus?: string): Observable<ProfitLossReport> {
    const params = { startDate, endDate };
    if (campus) (params as any).campus = campus;
    return this.http.get<ProfitLossReport>(`${this.apiUrl}/Accounts/profit-loss`, {
      ...this.getAuthHeaders(),
      params
    });
  }

  // Dashboard Data: Now fully aggregated on the backend
  getDashboardData(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.apiUrl}/Accounts/dashboard-data`, this.getAuthHeaders());
  }

  private groupByCategory(items: any[], categoryField: string): { category: string; amount: number }[] {
    const grouped = items.reduce((acc, item) => {
      const category = item[categoryField];
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += item.amount;
      return acc;
    }, {});

    return Object.keys(grouped).map(category => ({
      category,
      amount: grouped[category]
    }));
  }

}
