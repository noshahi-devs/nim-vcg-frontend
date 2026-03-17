import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, Transaction } from '../../../services/accounts.service';
import Swal from '../../../swal';

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

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  showViewModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  // Pagination
  rowsPerPage = 10;
  pageSizeOptions = [5, 10, 20, 50];
  currentPage = 1;

  // Totals
  totalDebit = 0;
  totalCredit = 0;
  finalBalance = 0;

  constructor(private accountsService: AccountsService) { }

  // ── Helpers ──
  triggerSuccess(title: string, msg: string) {
    this.feedbackType = 'success'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerError(title: string, msg: string) {
    this.feedbackType = 'error'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  closeFeedback() { this.showFeedbackModal = false; }
  closeViewModal() { this.showViewModal = false; }

  ngOnInit(): void {
    this.loadLedger();
  }

  loadLedger(): void {
    this.accountsService.getLedger().subscribe({
      next: (data) => {
        this.transactions = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading ledger:', err);
        Swal.fire('Error', 'Failed to load ledger', 'error');
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
    this.isProcessing = true;
    setTimeout(() => {
      this.isProcessing = false;
      this.triggerSuccess('Export Complete!', 'Ledger data has been exported successfully.');
    }, 1500);
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


