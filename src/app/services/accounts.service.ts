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

  // Ledger: Client-side aggregation of real data
  getLedger(): Observable<Transaction[]> {
    return forkJoin({
      incomes: this.getIncomeList(),
      expenses: this.getExpenses()
    }).pipe(
      map(({ incomes, expenses }) => {
        const transactions: Transaction[] = [];
        let balance = 0;
        let transactionCounter = 1;

        const all = [
          ...incomes.map(i => ({ ...i, type: 'Income', category: i.source })),
          ...expenses.map(e => ({ ...e, type: 'Expense', category: e.expenseType }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        all.forEach(t => {
          const debit = t.type === 'Expense' ? t.amount : 0;
          const credit = t.type === 'Income' ? t.amount : 0;
          balance += credit - debit;

          transactions.push({
            id: transactionCounter++,
            date: t.date,
            transactionId: `TXN-${new Date(t.date).getFullYear()}-${String(transactionCounter).padStart(4, '0')}`,
            type: t.type,
            category: t.category,
            description: t.description,
            debit,
            credit,
            balance
          });
        });

        return transactions.reverse();
      })
    );
  }

  // Profit & Loss Report
  getProfitLossReport(startDate: string, endDate: string, campusId?: string): Observable<ProfitLossReport> {
    return forkJoin({
      incomes: this.getIncomeList(),
      expenses: this.getExpenses()
    }).pipe(
      map(({ incomes, expenses }) => {
        const filteredIncome = incomes.filter(i => {
          const inRange = i.date >= startDate && i.date <= endDate;
          const inCampus = !campusId || i.campus === campusId;
          return inRange && inCampus;
        });

        const filteredExpenses = expenses.filter(e => {
          const inRange = e.date >= startDate && e.date <= endDate;
          const inCampus = !campusId || e.campus === campusId;
          return inRange && inCampus;
        });

        const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
        const netProfit = totalIncome - totalExpenses;

        // Group by category
        const incomeByCategory = this.groupByCategory(filteredIncome, 'source');
        const expenseByCategory = this.groupByCategory(filteredExpenses, 'expenseType');

        return {
          startDate,
          endDate,
          totalIncome,
          totalExpenses,
          netProfit,
          incomeByCategory,
          expenseByCategory
        };
      })
    );
  }

  getDashboardData(): Observable<DashboardData> {
    return forkJoin({
      incomes: this.getIncomeList(),
      expenses: this.getExpenses()
    }).pipe(
      map(({ incomes, expenses }) => {
        const monthMap = new Map<string, { income: number; expenses: number }>();

        const getMonthKey = (dateStr: string) => {
          const d = new Date(dateStr);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const processItem = (date: string, amount: number, type: 'income' | 'expenses') => {
          const key = getMonthKey(date);
          if (!monthMap.has(key)) {
            monthMap.set(key, { income: 0, expenses: 0 });
          }
          const data = monthMap.get(key)!;
          data[type] += amount;
        };

        incomes.forEach(i => processItem(i.date, i.amount, 'income'));
        expenses.forEach(e => processItem(e.date, e.amount, 'expenses'));

        // Sort keys chronologically
        const sortedKeys = Array.from(monthMap.keys()).sort();

        const months = sortedKeys.map(key => {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleString('default', { month: 'short', year: 'numeric' });
        });

        const income = sortedKeys.map(key => monthMap.get(key)!.income);
        const expensesData = sortedKeys.map(key => monthMap.get(key)!.expenses);

        // Get recent transactions from ledger logic
        const allTransactions = [
          ...incomes.map(i => ({ ...i, type: 'Income', category: i.source })),
          ...expenses.map(e => ({ ...e, type: 'Expense', category: e.expenseType }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const recentTransactions: Transaction[] = allTransactions.slice(0, 5).map((t, idx) => ({
          id: idx + 1,
          date: t.date,
          transactionId: `TXN-${new Date(t.date).getFullYear()}-${String(idx + 1).padStart(4, '0')}`,
          type: t.type,
          category: t.category,
          description: t.description,
          debit: t.type === 'Expense' ? t.amount : 0,
          credit: t.type === 'Income' ? t.amount : 0,
          balance: 0 // Balance not tracked here easily
        }));

        const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const profitLoss = totalIncome - totalExpenses;
        const cashBankBalance = profitLoss; // Simplified for now

        return {
          chartData: {
            months,
            income,
            expenses: expensesData
          },
          totalIncome,
          totalExpenses,
          profitLoss,
          cashBankBalance,
          recentTransactions
        };
      })
    );
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
