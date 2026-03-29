import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, Expense } from '../../../services/accounts.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

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

  loading = false;
  isProcessing = false;

  constructor(
    private accountsService: AccountsService,
    private authService: AuthService,
    private popup: PopupService
  ) { }

  // ── Helpers ──
  closeFeedback() { }

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
        this.popup.error('Load Error', 'Failed to synchronize expense records.');
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
    this.popup.loading('Saving expense record...');

    if (this.isEditMode && this.currentExpense.id) {
      this.accountsService.updateExpense(this.currentExpense.id, this.currentExpense)
        .pipe(finalize(() => {
          this.isProcessing = false;
          this.popup.closeLoading();
        }))
        .subscribe({
          next: () => {
            this.popup.success('Success!', 'Expense record updated.');
            this.loadExpenseList();
            this.closeModal();
          },
          error: (err) => {
            console.error('Error updating expense:', err);
            this.popup.error('Update Failed', 'Could not update expense record.');
          }
        });
    } else {
      this.accountsService.addExpense(this.currentExpense)
        .pipe(finalize(() => {
          this.isProcessing = false;
          this.popup.closeLoading();
        }))
        .subscribe({
          next: () => {
            this.popup.success('Success!', 'Expense record added.');
            this.loadExpenseList();
            this.closeModal();
          },
          error: (err) => {
            console.error('Error adding expense:', err);
            this.popup.error('Save Failed', 'Could not add expense record.');
          }
        });
    }
  }

  confirmDelete(expense: Expense) {
    this.popup.confirm(
      'Are you sure?',
      `Do you want to delete the expense: "${expense.description}"?`
    ).then(isConfirmed => {
      if (isConfirmed) {
        this.executeDelete(expense.id!);
      }
    });
  }

  executeDelete(id: number) {
    this.isProcessing = true;
    this.popup.loading('Deleting expense record...');
    this.accountsService.deleteExpense(id)
      .pipe(finalize(() => {
        this.isProcessing = false;
        this.popup.closeLoading();
      }))
      .subscribe({
        next: () => {
          this.popup.success('Deleted!', 'The expense has been removed.');
          this.loadExpenseList();
        },
        error: (err) => {
          console.error('Error deleting expense:', err);
          this.popup.error('Delete Failed', 'Failed to delete the record.');
        }
      });
  }

  validateForm(): boolean {
    if (!this.currentExpense.description || !this.currentExpense.amount) {
      this.popup.warning('Validation Required', 'Please fill all mandatory fields.');
      return false;
    }
    if (this.currentExpense.amount <= 0) {
      this.popup.warning('Invalid Amount', 'Amount must be greater than zero.');
      return false;
    }
    return true;
  }

  exportData(): void {
    if (!this.filteredList || this.filteredList.length === 0) {
      this.popup.warning('No Data', 'No records found to export.');
      return;
    }

    this.isProcessing = true;
    this.popup.loading('Extracting expense report...');
    setTimeout(() => {
      try {
        const headers = ['ID', 'Date', 'Type', 'Description', 'Approved By', 'Payment Method', 'Amount (PKR)'];
        const csvRows = [headers.join(',')];

        this.filteredList.forEach(expense => {
          const row = [
            `"${expense.id}"`,
            `"${new Date(expense.date).toLocaleDateString()}"`,
            `"${expense.expenseType || ''}"`,
            `"${expense.description || ''}"`,
            `"${expense.approvedBy || ''}"`,
            `"${expense.paymentMethod || ''}"`,
            `"${expense.amount}"`
          ];
          csvRows.push(row.join(','));
        });

        csvRows.push(`"","","","","","TOTAL","${this.totalExpenses}"`);

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        
        const timestamp = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `Expense_Report_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.popup.closeLoading();
        this.popup.success('Report Ready!', 'Your export is complete.');
      } catch (err) {
        console.error('Export failed:', err);
        this.isProcessing = false;
        this.popup.closeLoading();
        this.popup.error('Export Error', 'Failed to generate report.');
      }
    }, 800);
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


