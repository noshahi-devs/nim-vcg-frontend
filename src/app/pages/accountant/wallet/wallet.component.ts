import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';
import { BankAccount, BankAccountService } from '../../../services/bank-account.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './wallet.component.html',
  styleUrl: './wallet.component.css'
})
export class WalletComponent implements OnInit {
  title = 'Wallet & Accounts';
  Math = Math;

  accounts: BankAccount[] = [];
  filteredAccounts: BankAccount[] = [];
  loading = false;

  // Stats
  totalBalance = 0;
  activeAccountsCount = 0;

  // Modal
  showModal = false;
  isEditMode = false;
  accountForm: BankAccount = this.getEmptyForm();

  // Pagination
  rowsPerPage = 10;
  currentPage = 1;

  constructor(private bankAccountService: BankAccountService) { }

  ngOnInit(): void {
    this.loadAccounts();
  }

  getEmptyForm(): BankAccount {
    return {
      bankAccountId: 0,
      accountName: '',
      accountNumber: '',
      bankName: '',
      balance: 0,
      isActive: true,
      accountType: 'Bank'
    };
  }

  loadAccounts(): void {
    this.loading = true;
    this.bankAccountService.getBankAccounts()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.accounts = data;
          this.filteredAccounts = data;
          this.calculateStats();
        },
        error: (err) => {
          console.error('Error loading accounts:', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load accounts.' });
        }
      });
  }

  calculateStats(): void {
    this.totalBalance = this.accounts.reduce((sum, acc) => sum + (acc.isActive ? acc.balance : 0), 0);
    this.activeAccountsCount = this.accounts.filter(acc => acc.isActive).length;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.accountForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(acc: BankAccount): void {
    this.isEditMode = true;
    this.accountForm = { ...acc };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.accountForm = this.getEmptyForm();
  }

  saveAccount(): void {
    if (!this.accountForm.accountName || !this.accountForm.accountNumber) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please fill in required fields.' });
      return;
    }

    if (this.isEditMode) {
      this.bankAccountService.updateBankAccount(this.accountForm.bankAccountId, this.accountForm).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Updated!', text: 'Account updated.', timer: 1500, showConfirmButton: false });
          this.loadAccounts();
          this.closeModal();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Update failed.' })
      });
    } else {
      this.bankAccountService.createBankAccount(this.accountForm).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Created!', text: 'Account created.', timer: 1500, showConfirmButton: false });
          this.loadAccounts();
          this.closeModal();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Creation failed.' })
      });
    }
  }

  confirmDelete(acc: BankAccount): void {
    Swal.fire({
      title: 'Delete Account?',
      text: `Are you sure you want to delete ${acc.accountName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.bankAccountService.deleteBankAccount(acc.bankAccountId).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, showConfirmButton: false });
            this.loadAccounts();
          },
          error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Delete failed.' })
        });
      }
    });
  }

  get paginatedAccounts(): BankAccount[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredAccounts.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number { return Math.ceil(this.filteredAccounts.length / this.rowsPerPage); }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}
