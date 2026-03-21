import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, Expense } from '../../../services/accounts.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-expense-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './expense-manage.component.html',
  styleUrls: ['./expense-manage.component.css']
})
export class ExpenseManageComponent implements OnInit {
  title = 'Expense Management';
  expenseList: Expense[] = [];
  filteredList: Expense[] = [];
  totalExpenses = 0;

  showModal = false;
  isEditMode = false;
  currentExpense: Partial<Expense> = {};

  filterType = '';
  filterDateFrom = '';
  filterDateTo = '';

  expenseTypes = ['Salary', 'Bill', 'Purchase', 'Maintenance', 'Other'];
  paymentMethods = ['Cash', 'Bank', 'Cheque', 'Online'];
  showViewModal = false;
  selectedExpense: Expense | null = null;

  // ── Pagination State ──
  currentPage = 1;
  rowsPerPage = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  loading = false;

  showDeleteDialog = false;
  itemToDeleteId: number | null = null;
  itemToDeleteDesc = '';

  constructor(
    private accountsService: AccountsService,
    private authService: AuthService
  ) { }

  // ── Helpers ──
  triggerSuccess(title: string, msg: string) {
    this.feedbackType = 'success'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerError(title: string, msg: string) {
    this.feedbackType = 'error'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  closeFeedback() { this.showFeedbackModal = false; }

  ngOnInit(): void {
    this.loadExpenseList();
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  loadExpenseList(): void {
    this.loading = true;
    this.accountsService.getExpenses().pipe(finalize(() => this.loading = false)).subscribe({
      next: (data) => {
        this.expenseList = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading expenses:', err);
        this.triggerError('Error', 'Failed to load expense list');
      }
    });
  }

  applyFilters(): void {
    this.filteredList = this.expenseList.filter(expense => {
      const matchType = !this.filterType || expense.expenseType === this.filterType;
      const matchDateFrom = !this.filterDateFrom || expense.date >= this.filterDateFrom;
      const matchDateTo = !this.filterDateTo || expense.date <= this.filterDateTo;
      return matchType && matchDateFrom && matchDateTo;
    });
    this.totalExpenses = this.filteredList.reduce((sum, e) => sum + e.amount, 0);
    this.currentPage = 1; // Reset to first page when filters change
  }

  // ── Pagination Getters ──
  get pagedList(): Expense[] {
    const startIndex = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredList.slice(startIndex, startIndex + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredList.length / this.rowsPerPage) || 1;
  }

  get pageNumbers(): number[] {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) pages.push(i);
    return pages;
  }

  get paginationStart(): number {
    return this.filteredList.length === 0 ? 0 : (this.currentPage - 1) * this.rowsPerPage + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.rowsPerPage, this.filteredList.length);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentExpense = {
      date: new Date().toISOString().split('T')[0],
      expenseType: 'Other',
      paymentMethod: 'Cash',
      approvedBy: 'Admin'
    };
    this.showModal = true;
  }

  openEditModal(expense: Expense): void {
    this.isEditMode = true;
    this.currentExpense = { ...expense };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.currentExpense = {};
  }
  openViewModal(expense: Expense) {
    this.selectedExpense = expense; this.showViewModal = true;
  }
  closeViewModal() { this.showViewModal = false; }

  saveExpense(): void {
    if (!this.validateForm()) return;

    this.isProcessing = true;

    if (this.isEditMode && this.currentExpense.id) {
      this.accountsService.updateExpense(this.currentExpense.id, this.currentExpense)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Updated Successfully!', 'Expense record has been updated.');
            this.loadExpenseList();
            this.closeModal();
          },
          error: (err) => {
            console.error('Error updating expense:', err);
            this.triggerError('Error', 'Failed to update expense');
          }
        });
    } else {
      this.accountsService.addExpense(this.currentExpense)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Added Successfully!', 'Expense record has been saved.');
            this.loadExpenseList();
            this.closeModal();
          },
          error: (err) => {
            console.error('Error adding expense:', err);
            this.triggerError('Error', 'Failed to add expense');
          }
        });
    }
  }

  confirmDelete(expense: Expense) {
    this.itemToDeleteId = expense.id;
    this.itemToDeleteDesc = expense.description || '';
    this.showDeleteDialog = true;
  }

  executeDelete() {
    if (this.itemToDeleteId === null) return;
    this.showDeleteDialog = false;
    this.isProcessing = true;
    this.accountsService.deleteExpense(this.itemToDeleteId)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: () => {
          this.triggerSuccess('Deleted!', 'Expense has been deleted.');
          this.itemToDeleteId = null;
          this.loadExpenseList();
        },
        error: (err) => {
          console.error('Error deleting expense:', err);
          this.triggerError('Error', 'Failed to delete expense');
        }
      });
  }

  validateForm(): boolean {
    if (!this.currentExpense.description || !this.currentExpense.amount) {
      this.triggerError('Validation Error', 'Please fill all required fields');
      return false;
    }
    if (this.currentExpense.amount <= 0) {
      this.triggerError('Validation Error', 'Amount must be greater than 0');
      return false;
    }
    return true;
  }

  exportData(): void {
    this.triggerSuccess('Export', 'Exporting expense data to PDF...');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'Salary': 'bg-primary-focus text-primary-600',
      'Bill': 'bg-warning-focus text-warning-600',
      'Purchase': 'bg-info-focus text-info-600',
      'Maintenance': 'bg-danger-focus text-danger-600',
      'Other': 'bg-secondary-focus text-secondary-600'
    };
    return `${classes[type] || 'bg-secondary-focus text-secondary-600'} px-12 py-4 radius-4 fw-medium text-sm`;
  }
}


