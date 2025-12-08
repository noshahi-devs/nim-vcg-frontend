import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Income {
  id: number;
  date: string;
  source: 'Fee' | 'Donation' | 'Misc';
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online';
  receivedBy: string;
  campus: string;
  createdAt: string;
}

export interface Expense {
  id: number;
  date: string;
  expenseType: 'Salary' | 'Bill' | 'Purchase' | 'Maintenance' | 'Other';
  description: string;
  amount: number;
  paymentMethod: 'Cash' | 'Bank' | 'Cheque' | 'Online';
  paidTo: string;
  approvedBy: string;
  campus: string;
  createdAt: string;
}

export interface Transaction {
  id: number;
  date: string;
  transactionId: string;
  type: 'Income' | 'Expense';
  category: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  profitLoss: number;
  cashBankBalance: number;
  chartData: {
    months: string[];
    income: number[];
    expenses: number[];
  };
  recentTransactions: Transaction[];
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

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private incomeList: Income[] = [
    {
      id: 1,
      date: '2025-11-01',
      source: 'Fee',
      description: 'November Fee Collection',
      amount: 125000,
      paymentMethod: 'Bank',
      receivedBy: 'Admin',
      campus: 'Main Campus',
      createdAt: '2025-11-01T10:00:00'
    },
    {
      id: 2,
      date: '2025-11-05',
      source: 'Donation',
      description: 'Annual Donation',
      amount: 50000,
      paymentMethod: 'Cheque',
      receivedBy: 'Principal',
      campus: 'Main Campus',
      createdAt: '2025-11-05T14:30:00'
    },
    {
      id: 3,
      date: '2025-11-08',
      source: 'Misc',
      description: 'Library Fine Collection',
      amount: 5000,
      paymentMethod: 'Cash',
      receivedBy: 'Librarian',
      campus: 'Main Campus',
      createdAt: '2025-11-08T11:15:00'
    }
  ];

  private expenseList: Expense[] = [
    {
      id: 1,
      date: '2025-11-02',
      expenseType: 'Salary',
      description: 'Staff Salary - November',
      amount: 85000,
      paymentMethod: 'Bank',
      paidTo: 'Staff Members',
      approvedBy: 'Principal',
      campus: 'Main Campus',
      createdAt: '2025-11-02T09:00:00'
    },
    {
      id: 2,
      date: '2025-11-06',
      expenseType: 'Bill',
      description: 'Electricity Bill',
      amount: 12000,
      paymentMethod: 'Online',
      paidTo: 'WAPDA',
      approvedBy: 'Admin',
      campus: 'Main Campus',
      createdAt: '2025-11-06T15:00:00'
    },
    {
      id: 3,
      date: '2025-11-09',
      expenseType: 'Purchase',
      description: 'Stationery Purchase',
      amount: 8000,
      paymentMethod: 'Cash',
      paidTo: 'ABC Stationers',
      approvedBy: 'Admin',
      campus: 'Main Campus',
      createdAt: '2025-11-09T10:30:00'
    }
  ];

  constructor() {}

  // Dashboard Data
  getDashboardData(): Observable<DashboardData> {
    const totalIncome = this.incomeList.reduce((sum, item) => sum + item.amount, 0);
    const totalExpenses = this.expenseList.reduce((sum, item) => sum + item.amount, 0);
    const profitLoss = totalIncome - totalExpenses;
    const cashBankBalance = profitLoss; // Simplified

    const chartData = {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      income: [95000, 98000, 102000, 105000, 110000, 115000, 118000, 120000, 122000, 125000, 180000, 0],
      expenses: [75000, 78000, 80000, 82000, 85000, 87000, 90000, 92000, 95000, 98000, 105000, 0]
    };

    const transactions = this.getLedgerData();
    const recentTransactions = transactions.slice(0, 5);

    return of({
      totalIncome,
      totalExpenses,
      profitLoss,
      cashBankBalance,
      chartData,
      recentTransactions
    });
  }

  // Income Management
  getIncomeList(): Observable<Income[]> {
    return of([...this.incomeList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }

  addIncome(income: Partial<Income>): Observable<Income> {
    const newIncome: Income = {
      id: this.incomeList.length + 1,
      date: income.date || new Date().toISOString().split('T')[0],
      source: income.source || 'Misc',
      description: income.description || '',
      amount: income.amount || 0,
      paymentMethod: income.paymentMethod || 'Cash',
      receivedBy: income.receivedBy || 'Admin',
      campus: income.campus || 'Main Campus',
      createdAt: new Date().toISOString()
    };
    this.incomeList.unshift(newIncome);
    return of(newIncome);
  }

  updateIncome(id: number, income: Partial<Income>): Observable<Income | undefined> {
    const index = this.incomeList.findIndex(i => i.id === id);
    if (index !== -1) {
      this.incomeList[index] = { ...this.incomeList[index], ...income };
      return of(this.incomeList[index]);
    }
    return of(undefined);
  }

  deleteIncome(id: number): Observable<boolean> {
    const index = this.incomeList.findIndex(i => i.id === id);
    if (index !== -1) {
      this.incomeList.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Expense Management
  getExpenses(): Observable<Expense[]> {
    return of([...this.expenseList].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }

  addExpense(expense: Partial<Expense>): Observable<Expense> {
    const newExpense: Expense = {
      id: this.expenseList.length + 1,
      date: expense.date || new Date().toISOString().split('T')[0],
      expenseType: expense.expenseType || 'Other',
      description: expense.description || '',
      amount: expense.amount || 0,
      paymentMethod: expense.paymentMethod || 'Cash',
      paidTo: expense.paidTo || '',
      approvedBy: expense.approvedBy || 'Admin',
      campus: expense.campus || 'Main Campus',
      createdAt: new Date().toISOString()
    };
    this.expenseList.unshift(newExpense);
    return of(newExpense);
  }

  updateExpense(id: number, expense: Partial<Expense>): Observable<Expense | undefined> {
    const index = this.expenseList.findIndex(e => e.id === id);
    if (index !== -1) {
      this.expenseList[index] = { ...this.expenseList[index], ...expense };
      return of(this.expenseList[index]);
    }
    return of(undefined);
  }

  deleteExpense(id: number): Observable<boolean> {
    const index = this.expenseList.findIndex(e => e.id === id);
    if (index !== -1) {
      this.expenseList.splice(index, 1);
      return of(true);
    }
    return of(false);
  }

  // Profit & Loss Report
  getProfitLossReport(startDate: string, endDate: string, campusId?: string): Observable<ProfitLossReport> {
    const filteredIncome = this.incomeList.filter(i => {
      const inRange = i.date >= startDate && i.date <= endDate;
      const inCampus = !campusId || i.campus === campusId;
      return inRange && inCampus;
    });

    const filteredExpenses = this.expenseList.filter(e => {
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

    return of({
      startDate,
      endDate,
      totalIncome,
      totalExpenses,
      netProfit,
      incomeByCategory,
      expenseByCategory
    });
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

  // Ledger / Transactions
  getLedger(): Observable<Transaction[]> {
    return of(this.getLedgerData());
  }

  private getLedgerData(): Transaction[] {
    const transactions: Transaction[] = [];
    let balance = 0;
    let transactionCounter = 1;

    // Combine income and expenses
    const allTransactions = [
      ...this.incomeList.map(i => ({ ...i, type: 'Income' as const, category: i.source })),
      ...this.expenseList.map(e => ({ ...e, type: 'Expense' as const, category: e.expenseType }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    allTransactions.forEach(t => {
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

    return transactions.reverse(); // Most recent first
  }
}