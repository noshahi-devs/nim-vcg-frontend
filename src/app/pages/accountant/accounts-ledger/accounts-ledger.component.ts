import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, Transaction } from '../../../services/accounts.service';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-accounts-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './accounts-ledger.component.html',
  styleUrl: './accounts-ledger.component.css'
})
export class AccountsLedgerComponent implements OnInit {
  title = 'Accounts Ledger';
  transactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];

  // Filters
  filterType = '';
  filterDateFrom = '';
  filterDateTo = '';
  searchTerm = '';
  selectedTransaction: Transaction | null = null;

  showViewModal = false;

  // Pagination
  rowsPerPage = 10;
  pageSizeOptions = [5, 10, 20, 50];
  currentPage = 1;

  // Totals
  totalDebit = 0;
  totalCredit = 0;
  finalBalance = 0;

  constructor(
    private accountsService: AccountsService,
    private popup: PopupService
  ) { }

  // ── Helpers ──
  closeFeedback() { }
  closeViewModal() { this.showViewModal = false; }

  ngOnInit(): void {
    this.loadLedger();
  }

  loadLedger(): void {
    this.popup.loading('Scanning account ledger...');
    this.accountsService.getLedger().subscribe({
      next: (data) => {
        this.transactions = data;
        this.applyFilters();
        this.popup.closeLoading();
        this.popup.success('Ledger Loaded', 'Transaction history synchronized.');
      },
      error: (err) => {
        console.error('Error loading ledger:', err);
        this.popup.closeLoading();
        this.popup.error('Load Error', 'Failed to synchronize ledger records.');
      }
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredTransactions = this.transactions.filter(t => {
      const matchType = !this.filterType || t.type === this.filterType;
      const matchDateFrom = !this.filterDateFrom || t.date >= this.filterDateFrom;
      const matchDateTo = !this.filterDateTo || t.date <= this.filterDateTo;
      const matchSearch = !term
        || String(t.transactionId ?? '').toLowerCase().includes(term)
        || String(t.category ?? '').toLowerCase().includes(term)
        || String(t.description ?? '').toLowerCase().includes(term)
        || String(t.type ?? '').toLowerCase().includes(term);
      return matchType && matchDateFrom && matchDateTo && matchSearch;
    });

    this.currentPage = 1;
    this.ensureValidPage();
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.totalDebit = this.filteredTransactions.reduce((sum, t) => sum + t.debit, 0);
    this.totalCredit = this.filteredTransactions.reduce((sum, t) => sum + t.credit, 0);
    this.finalBalance = this.filteredTransactions.length > 0
      ? this.filteredTransactions[0].balance
      : 0;
  }

  viewDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showViewModal = true;
  }

  exportLedger(): void {
    if (!this.filteredTransactions || this.filteredTransactions.length === 0) {
      this.popup.warning('No Data', 'No records found to export.');
      return;
    }

    this.popup.loading('Generating ledger export...');
    setTimeout(() => {
      try {
        const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Description', 'Debit (PKR)', 'Credit (PKR)', 'Balance (PKR)'];
        const csvRows = [headers.join(',')];

        this.filteredTransactions.forEach(t => {
          const row = [
            `"${t.transactionId || ''}"`,
            `"${new Date(t.date).toLocaleDateString()}"`,
            `"${t.type || ''}"`,
            `"${t.category || ''}"`,
            `"${(t.description || '').replace(/"/g, '""')}"`,
            `"${t.debit}"`,
            `"${t.credit}"`,
            `"${t.balance}"`
          ];
          csvRows.push(row.join(','));
        });

        csvRows.push(`"","","","","TOTAL","${this.totalDebit}","${this.totalCredit}","${this.finalBalance}"`);

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `Accounts_Ledger_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.popup.closeLoading();
        this.popup.success('Export Ready!', 'Ledger report (CSV) has been downloaded.');
      } catch (err) {
        console.error('Export failed:', err);
        this.popup.closeLoading();
        this.popup.error('Export Error', 'Failed to generate report.');
      }
    }, 800);
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  get pagedTransactions(): Transaction[] {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredTransactions.slice(startIndex, startIndex + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / this.rowsPerPage));
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    if (!this.filteredTransactions.length) {
      return 0;
    }
    return (this.currentPage - 1) * this.rowsPerPage + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.rowsPerPage, this.filteredTransactions.length);
  }

  private ensureValidPage(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getTypeBadgeClass(type: string): string {
    return type === 'Income'
      ? 'bg-success-focus text-success-main px-12 py-4 radius-4 fw-medium text-sm'
      : 'bg-danger-focus text-danger-main px-12 py-4 radius-4 fw-medium text-sm';
  }

  getBalanceClass(balance: number): string {
    return balance >= 0 ? 'text-success-main' : 'text-danger-main';
  }
}


