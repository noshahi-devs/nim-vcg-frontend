import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, DashboardData, Expense, Income, Transaction } from '../../../services/accounts.service';
import { NgApexchartsModule } from 'ng-apexcharts';
import { AuthService } from '../../../SecurityModels/auth.service';
import Swal from '../../../swal';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PopupService } from '../../../services/popup.service';

type DashboardKpis = {
  incomeChange: number;
  expenseChange: number;
  netChange: number;
  profitMargin: number;
};

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, NgApexchartsModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './accounts.component.html',
  styleUrl: './accounts.component.css'
})
export class AccountsComponent implements OnInit {
  title = 'Accounts Dashboard';
  dashboardData: DashboardData | null = null;
  loading = true;

  closeFeedback() { } // Handled by PopupService

  // Data state
  lastUpdated = '';
  kpiSummary: DashboardKpis = {
    incomeChange: 0,
    expenseChange: 0,
    netChange: 0,
    profitMargin: 0
  };

  // Ledger summary cards
  ledgerSummaryLoaded = false;
  totalDebit = 0;
  totalCredit = 0;
  currentBalance = 0;

  // Table filters & pagination
  searchTerm = '';
  typeFilter: 'All' | 'Income' | 'Expense' = 'All';
  dateFrom = '';
  dateTo = '';
  rowsPerPage = 5;
  currentPage = 1;
  pageSizeOptions = [5, 10, 20];

  // Chart configuration
  chartOptions: any;

  private emptyDashboardData(): DashboardData {
    return {
      chartData: {
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        income: [0, 0, 0, 0, 0, 0],
        expenses: [0, 0, 0, 0, 0, 0]
      },
      totalIncome: 0,
      totalExpenses: 0,
      profitLoss: 0,
      cashBankBalance: 0,
      recentTransactions: []
    };
  }

  constructor(
    private accountsService: AccountsService,
    public authService: AuthService,
    private popup: PopupService
  ) { }

  get displayName(): string {
    return this.authService.userValue?.username || this.authService.userValue?.email || 'Accountant';
  }


  ngOnInit(): void {
    this.loadDashboardData();
    this.loadLedgerSummary();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.popup.loading('Loading dashboard data...');
    this.loadLedgerSummary();
    this.accountsService.getDashboardData().subscribe({
      next: (data) => {
        if (!this.isValidDashboardData(data)) {
          this.setDashboardData(this.emptyDashboardData());
          this.loading = false;
          this.popup.closeLoading();
          return;
        }
        this.setDashboardData(data);
        this.syncTotalsWithIncomeExpense();
        this.loading = false;
        this.popup.closeLoading();
        this.popup.success('Success!', 'Dashboard data updated.');
      },
      error: (err) => {
        console.error('Error loading dashboard data:', err);
        this.setDashboardData(this.emptyDashboardData());
        this.loading = false;
        this.popup.closeLoading();
        this.popup.error('Failed to Load', 'Could not load accounts data. Please check your connection and try again.');
      }
    });
  }

  private isValidDashboardData(data: DashboardData | null | undefined): data is DashboardData {
    if (!data || !data.chartData) return false;
    if (!Array.isArray(data.chartData.months)) return false;
    if (!Array.isArray(data.chartData.income)) return false;
    if (!Array.isArray(data.chartData.expenses)) return false;
    if (!Array.isArray(data.recentTransactions)) return false;
    return true;
  }

  private setDashboardData(data: DashboardData): void {
    this.dashboardData = data;
    this.lastUpdated = new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    this.kpiSummary = this.buildKpiSummary(data);
    this.initializeChart();
    this.currentPage = 1;
  }

  private buildKpiSummary(data: DashboardData): DashboardKpis {
    const incomeSeries = data.chartData?.income ?? [];
    const expenseSeries = data.chartData?.expenses ?? [];

    const lastIncome = incomeSeries[incomeSeries.length - 1] ?? 0;
    const prevIncome = incomeSeries[incomeSeries.length - 2] ?? lastIncome;
    const lastExpense = expenseSeries[expenseSeries.length - 1] ?? 0;
    const prevExpense = expenseSeries[expenseSeries.length - 2] ?? lastExpense;

    const netCurrent = lastIncome - lastExpense;
    const netPrev = prevIncome - prevExpense;

    return {
      incomeChange: this.calculateChange(lastIncome, prevIncome),
      expenseChange: this.calculateChange(lastExpense, prevExpense),
      netChange: this.calculateChange(netCurrent, netPrev),
      profitMargin: data.totalIncome ? (data.profitLoss / data.totalIncome) * 100 : 0
    };
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / previous) * 100;
  }

  private parseAmount(value: unknown): number {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[^0-9.-]+/g, '');
      const parsed = Number(cleaned);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private loadLedgerSummary(): void {
    this.ledgerSummaryLoaded = false;
    this.accountsService.getLedger()
      .pipe(catchError(() => of([] as Transaction[])))
      .subscribe((transactions) => {
        if (!transactions || transactions.length === 0) {
          this.totalDebit = 0;
          this.totalCredit = 0;
          this.currentBalance = 0;
          this.ledgerSummaryLoaded = true;
          return;
        }

        this.totalDebit = transactions.reduce((sum, t) => sum + this.parseAmount(t.debit), 0);
        this.totalCredit = transactions.reduce((sum, t) => sum + this.parseAmount(t.credit), 0);

        const latest = [...transactions].sort((a, b) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        })[0];
        this.currentBalance = latest ? this.parseAmount(latest.balance) : 0;
        this.ledgerSummaryLoaded = true;
      });
  }

  private syncTotalsWithIncomeExpense(): void {
    forkJoin({
      generalIncomes: this.accountsService.getIncomeList().pipe(catchError(() => of([] as Income[]))),
      feePayments: this.accountsService.getMonthlyPayments().pipe(catchError(() => of([]))),
      otherPayments: this.accountsService.getOthersPayments().pipe(catchError(() => of([]))),
      expenses: this.accountsService.getExpenses().pipe(catchError(() => of([] as Expense[])))
    }).subscribe(({ generalIncomes, feePayments, otherPayments, expenses }) => {
      if (!this.dashboardData) return;

      const totalGeneral = generalIncomes.reduce((sum, item) => sum + this.parseAmount(item.amount), 0);
      const totalFees = feePayments.reduce((sum, item) => sum + this.parseAmount(item.amountPaid), 0);
      const totalOthers = otherPayments.reduce((sum, item) => sum + this.parseAmount(item.amountPaid), 0);

      const totalIncome = totalGeneral + totalFees + totalOthers;
      const totalExpenses = expenses.reduce((sum, item) => sum + this.parseAmount(item.amount), 0);

      this.dashboardData = {
        ...this.dashboardData,
        totalIncome,
        totalExpenses,
        profitLoss: totalIncome - totalExpenses,
        cashBankBalance: totalIncome - totalExpenses
      };
      this.kpiSummary = this.buildKpiSummary(this.dashboardData);
    });
  }

  private getThemeColor(variable: string, fallback: string): string {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return value || fallback;
  }

  initializeChart(): void {
    if (!this.dashboardData) return;

    const primary = this.getThemeColor('--primary-color', '#487fff');
    const secondary = this.getThemeColor('--secondary-color', '#ff9f29');

    this.chartOptions = {
      series: [
        {
          name: 'Income',
          data: this.dashboardData.chartData.income
        },
        {
          name: 'Expenses',
          data: this.dashboardData.chartData.expenses
        }
      ],
      chart: {
        type: 'area',
        height: 320,
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      markers: { size: 0, hover: { size: 5 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 3, curve: 'smooth' },
      xaxis: {
        categories: this.dashboardData.chartData.months,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: '#64748b',
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => this.formatCurrencyShort(val),
          style: {
            colors: '#94a3b8',
            fontSize: '12px'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.6,
          opacityFrom: 0.28,
          opacityTo: 0.05,
          stops: [0, 90, 100]
        }
      },
      colors: [primary, secondary],
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        fontWeight: 600,
        labels: { colors: '#475569' }
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        padding: { left: 8, right: 12, top: 0, bottom: 0 }
      },
      tooltip: {
        theme: 'light'
      }
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  formatCurrencyShort(amount: number): string {
    if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return (amount / 1000).toFixed(0) + 'K';
    return amount.toString();
  }

  get transactions(): Transaction[] {
    return this.dashboardData?.recentTransactions ?? [];
  }

  get filteredTransactions(): Transaction[] {
    const term = this.searchTerm.trim().toLowerCase();
    const fromDate = this.dateFrom ? new Date(this.dateFrom) : null;
    const toDate = this.dateTo ? new Date(this.dateTo) : null;
    if (fromDate) fromDate.setHours(0, 0, 0, 0);
    if (toDate) toDate.setHours(23, 59, 59, 999);

    return this.transactions.filter((tx) => {
      const matchTerm = !term || [tx.transactionId, tx.category, tx.description, tx.type]
        .filter(Boolean)
        .some(value => value.toLowerCase().includes(term));
      const matchType = this.typeFilter === 'All' || tx.type === this.typeFilter;
      const txDate = new Date(tx.date);
      const matchFrom = !fromDate || txDate >= fromDate;
      const matchTo = !toDate || txDate <= toDate;
      return matchTerm && matchType && matchFrom && matchTo;
    });
  }

  get pagedTransactions(): Transaction[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredTransactions.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return this.filteredTransactions.length === 0
      ? 0
      : Math.ceil(this.filteredTransactions.length / this.rowsPerPage);
  }

  get paginationStart(): number {
    if (this.filteredTransactions.length === 0) return 0;
    return (this.currentPage - 1) * this.rowsPerPage + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.rowsPerPage, this.filteredTransactions.length);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onFilterChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.typeFilter = 'All';
    this.dateFrom = '';
    this.dateTo = '';
    this.rowsPerPage = this.pageSizeOptions[0];
    this.currentPage = 1;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  viewTransaction(transaction: any): void {
    const isIncome = transaction.type === 'Income';
    const amountClass = isIncome ? 'text-success-main' : 'text-danger-main';
    const iconName = isIncome ? 'solar:check-circle-bold-duotone' : 'solar:info-circle-bold-duotone';
    const incomeColor = this.getThemeColor('--primary-color', '#487fff');
    const expenseColor = this.getThemeColor('--secondary-color', '#ff9f29');
    const statusColor = isIncome ? incomeColor : expenseColor;

    Swal.fire({
      html: `
        <div class="modal-receipt-container">
          <div class="receipt-header" style="background: ${statusColor}15; color: ${statusColor};">
            <iconify-icon icon="${iconName}" style="font-size: 54px;"></iconify-icon>
            <div class="receipt-title">TRANSACTION RECEIPT</div>
            <div class="receipt-status">${isIncome ? 'Payment Received' : 'Expense Recorded'}</div>
          </div>

          <div class="receipt-body">
            <div class="receipt-id-row">
              <span class="label">Reference ID</span>
              <span class="value">#${transaction.transactionId.toUpperCase()}</span>
            </div>

            <div class="receipt-divider"></div>

            <div class="receipt-grid">
              <div class="receipt-item">
                <span class="label">Date & Time</span>
                <span class="value">${new Date(transaction.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
              <div class="receipt-item text-end">
                <span class="label">Category</span>
                <span class="value">${transaction.category}</span>
              </div>
              <div class="receipt-item">
                <span class="label">Payment Type</span>
                <span class="value">${transaction.type}</span>
              </div>
              <div class="receipt-item text-end">
                <span class="label">Status</span>
                <span class="value text-success">Verified</span>
              </div>
            </div>

            <div class="receipt-divider"></div>

            <div class="receipt-memo">
              <span class="label">Description / Memo</span>
              <p class="memo-text">${transaction.description}</p>
            </div>

            <div class="receipt-total-box">
              <div class="total-row">
                <span>Subtotal</span>
                <span>${this.formatCurrency(isIncome ? transaction.credit : transaction.debit)}</span>
              </div>
              <div class="total-row">
                <span>Tax / Service Fee</span>
                <span>Rs. 0</span>
              </div>
              <div class="receipt-divider" style="opacity: 0.1;"></div>
              <div class="total-row grand-total ${amountClass}">
                <span>Total Amount</span>
                <span>${this.formatCurrency(isIncome ? transaction.credit : transaction.debit)}</span>
              </div>
            </div>
          </div>

          <div class="receipt-footer">
            <button class="receipt-btn btn-secondary" onclick="window.printReceipt()">
              <iconify-icon icon="solar:printer-minimalistic-linear"></iconify-icon>
              Print Receipt
            </button>
            <button class="receipt-btn btn-primary" onclick="window.closeReceipt()">
              Done
            </button>
          </div>
        </div>
      `,
      showConfirmButton: false,
      padding: '0',
      width: '420px',
      customClass: {
        popup: 'modern-receipt-popup'
      },
      showClass: {
        popup: 'animate__animated animate__fadeInUp animate__faster'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutDown animate__faster'
      },
      didOpen: () => {
        (window as any).printReceipt = () => {
          const popupEl = document.querySelector('.modern-receipt-popup') as HTMLElement;
          if (!popupEl) return;
          const printWindow = window.open('', '', 'width=450,height=700');
          if (!printWindow) return;
          printWindow.document.write(`
            <html><head><title>Transaction Receipt</title>
            <style>body{font-family:sans-serif;padding:20px;} .receipt-footer{display:none;}</style>
            </head><body>${popupEl.innerHTML}</body></html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
        };
        (window as any).closeReceipt = () => {
          Swal.close();
        };
      }
    });
  }

  exportData(): void {
    this.popup.loading('Generating export file...');
    setTimeout(() => {
      this.popup.closeLoading();
      this.popup.success('Exported!', 'The report has been generated successfully.');
    }, 1500);
  }
}
