import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, Transaction } from '../../../services/accounts.service';
import Swal from 'sweetalert2';

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

  // Totals
  totalDebit = 0;
  totalCredit = 0;
  finalBalance = 0;

  constructor(private accountsService: AccountsService) { }

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
    this.filteredTransactions = this.transactions.filter(t => {
      const matchType = !this.filterType || t.type === this.filterType;
      const matchDateFrom = !this.filterDateFrom || t.date >= this.filterDateFrom;
      const matchDateTo = !this.filterDateTo || t.date <= this.filterDateTo;
      return matchType && matchDateFrom && matchDateTo;
    });

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
    Swal.fire({
      title: 'Transaction Details',
      html: `
        <div class="text-start">
          <p><strong>Transaction ID:</strong> ${transaction.transactionId}</p>
          <p><strong>Date:</strong> ${transaction.date}</p>
          <p><strong>Type:</strong> ${transaction.type}</p>
          <p><strong>Category:</strong> ${transaction.category}</p>
          <p><strong>Description:</strong> ${transaction.description}</p>
          <p><strong>Debit:</strong> ${this.formatCurrency(transaction.debit)}</p>
          <p><strong>Credit:</strong> ${this.formatCurrency(transaction.credit)}</p>
          <p><strong>Balance:</strong> ${this.formatCurrency(transaction.balance)}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Close',
      width: '500px'
    });
  }

  exportLedger(): void {
    Swal.fire('Export', 'Exporting ledger to PDF...', 'success');
  }

  clearFilters(): void {
    this.filterType = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.applyFilters();
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
