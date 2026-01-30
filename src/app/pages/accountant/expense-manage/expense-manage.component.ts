import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AccountsService, Expense } from '../../../services/accounts.service';
import Swal from 'sweetalert2';

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
  filterCampus = '';
  filterDateFrom = '';
  filterDateTo = '';

  expenseTypes = ['Salary', 'Bill', 'Purchase', 'Maintenance', 'Other'];
  paymentMethods = ['Cash', 'Bank', 'Cheque', 'Online'];
  campuses = ['Main Campus', 'Branch Campus'];

  constructor(private accountsService: AccountsService) { }

  ngOnInit(): void {
    this.loadExpenseList();
  }

  loadExpenseList(): void {
    this.accountsService.getExpenses().subscribe({
      next: (data) => {
        this.expenseList = data;
        this.applyFilters();
      },
      error: (err) => {
        console.error('Error loading expenses:', err);
        Swal.fire('Error', 'Failed to load expense list', 'error');
      }
    });
  }

  applyFilters(): void {
    this.filteredList = this.expenseList.filter(expense => {
      const matchType = !this.filterType || expense.expenseType === this.filterType;
      const matchCampus = !this.filterCampus || expense.campus === this.filterCampus;
      const matchDateFrom = !this.filterDateFrom || expense.date >= this.filterDateFrom;
      const matchDateTo = !this.filterDateTo || expense.date <= this.filterDateTo;
      return matchType && matchCampus && matchDateFrom && matchDateTo;
    });
    this.totalExpenses = this.filteredList.reduce((sum, e) => sum + e.amount, 0);
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.currentExpense = {
      date: new Date().toISOString().split('T')[0],
      expenseType: 'Other',
      paymentMethod: 'Cash',
      campus: 'Main Campus',
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

  saveExpense(): void {
    if (!this.validateForm()) return;

    if (this.isEditMode && this.currentExpense.id) {
      this.accountsService.updateExpense(this.currentExpense.id, this.currentExpense).subscribe({
        next: () => {
          Swal.fire('Success', 'Expense updated successfully', 'success');
          this.loadExpenseList();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating expense:', err);
          Swal.fire('Error', 'Failed to update expense', 'error');
        }
      });
    } else {
      this.accountsService.addExpense(this.currentExpense).subscribe({
        next: () => {
          Swal.fire('Success', 'Expense added successfully', 'success');
          this.loadExpenseList();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error adding expense:', err);
          Swal.fire('Error', 'Failed to add expense', 'error');
        }
      });
    }
  }

  deleteExpense(expense: Expense): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Delete expense: ${expense.description}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.accountsService.deleteExpense(expense.id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Expense has been deleted.', 'success');
            this.loadExpenseList();
          },
          error: (err) => {
            console.error('Error deleting expense:', err);
            Swal.fire('Error', 'Failed to delete expense', 'error');
          }
        });
      }
    });
  }

  validateForm(): boolean {
    if (!this.currentExpense.description || !this.currentExpense.amount) {
      Swal.fire('Validation Error', 'Please fill all required fields', 'warning');
      return false;
    }
    if (this.currentExpense.amount <= 0) {
      Swal.fire('Validation Error', 'Amount must be greater than 0', 'warning');
      return false;
    }
    return true;
  }

  exportData(): void {
    Swal.fire('Export', 'Exporting expense data to PDF...', 'success');
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