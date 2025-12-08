import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';

export interface BankAccount {
  id: number;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string;
  accountType: 'Savings' | 'Current';
  balance: number;
  status: 'Active' | 'Inactive';
}

export interface CashAccount {
  id: number;
  accountName: string;
  location: string;
  balance: number;
  lastUpdated: string;
}

export interface PaymentGateway {
  id: number;
  gatewayName: string;
  apiKey: string;
  secretKey: string;
  status: 'Active' | 'Inactive';
  transactionFee: number;
}

@Component({
  selector: 'app-bank-cash',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './bank-cash.component.html',
  styleUrl: './bank-cash.component.css'
})
export class BankCashComponent implements OnInit {
  title = 'Bank & Cash Management';
  activeTab: 'bank' | 'cash' | 'gateway' = 'bank';

  // Bank Accounts
  bankAccounts: BankAccount[] = [];
  showBankModal = false;
  isEditBankMode = false;
  currentBankAccount: Partial<BankAccount> = {};

  // Cash Accounts
  cashAccounts: CashAccount[] = [];
  showCashModal = false;
  isEditCashMode = false;
  currentCashAccount: Partial<CashAccount> = {};

  // Payment Gateways
  paymentGateways: PaymentGateway[] = [];
  showGatewayModal = false;
  isEditGatewayMode = false;
  currentGateway: Partial<PaymentGateway> = {};

  // Totals
  totalBankBalance = 0;
  totalCashBalance = 0;
  totalBalance = 0;

  accountTypes = ['Savings', 'Current'];
  statuses = ['Active', 'Inactive'];

  ngOnInit(): void {
    this.loadMockData();
    this.calculateTotals();
  }

  loadMockData(): void {
    this.bankAccounts = [
      { id: 1, accountName: 'School Main Account', accountNumber: '1234567890', bankName: 'HBL', branchName: 'Main Branch', accountType: 'Current', balance: 500000, status: 'Active' },
      { id: 2, accountName: 'Fee Collection Account', accountNumber: '0987654321', bankName: 'UBL', branchName: 'City Branch', accountType: 'Current', balance: 350000, status: 'Active' },
      { id: 3, accountName: 'Savings Account', accountNumber: '5555666677', bankName: 'MCB', branchName: 'Downtown', accountType: 'Savings', balance: 200000, status: 'Active' }
    ];

    this.cashAccounts = [
      { id: 1, accountName: 'Main Office Cash', location: 'Admin Office', balance: 50000, lastUpdated: '2025-01-10' },
      { id: 2, accountName: 'Fee Counter Cash', location: 'Fee Counter', balance: 25000, lastUpdated: '2025-01-10' },
      { id: 3, accountName: 'Petty Cash', location: 'Accounts Department', balance: 10000, lastUpdated: '2025-01-09' }
    ];

    this.paymentGateways = [
      { id: 1, gatewayName: 'JazzCash', apiKey: 'jazz_api_key_***', secretKey: '***hidden***', status: 'Active', transactionFee: 2.5 },
      { id: 2, gatewayName: 'EasyPaisa', apiKey: 'easy_api_key_***', secretKey: '***hidden***', status: 'Active', transactionFee: 2.0 },
      { id: 3, gatewayName: 'Bank Transfer', apiKey: 'bank_api_key_***', secretKey: '***hidden***', status: 'Inactive', transactionFee: 0 }
    ];
  }

  calculateTotals(): void {
    this.totalBankBalance = this.bankAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    this.totalCashBalance = this.cashAccounts.reduce((sum, acc) => sum + acc.balance, 0);
    this.totalBalance = this.totalBankBalance + this.totalCashBalance;
  }

  // Bank Methods
  openAddBankModal(): void {
    this.isEditBankMode = false;
    this.currentBankAccount = { accountType: 'Current', status: 'Active', balance: 0 };
    this.showBankModal = true;
  }

  openEditBankModal(account: BankAccount): void {
    this.isEditBankMode = true;
    this.currentBankAccount = { ...account };
    this.showBankModal = true;
  }

  saveBankAccount(): void {
    if (!this.currentBankAccount.accountName || !this.currentBankAccount.accountNumber) {
      Swal.fire('Error', 'Please fill all required fields', 'warning');
      return;
    }

    if (this.isEditBankMode) {
      const index = this.bankAccounts.findIndex(a => a.id === this.currentBankAccount.id);
      if (index !== -1) this.bankAccounts[index] = this.currentBankAccount as BankAccount;
      Swal.fire('Success', 'Bank account updated', 'success');
    } else {
      this.bankAccounts.push({ id: this.bankAccounts.length + 1, ...this.currentBankAccount } as BankAccount);
      Swal.fire('Success', 'Bank account added', 'success');
    }
    this.calculateTotals();
    this.closeBankModal();
  }

  deleteBankAccount(account: BankAccount): void {
    Swal.fire({
      title: 'Delete?',
      text: `Delete ${account.accountName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes'
    }).then((result) => {
      if (result.isConfirmed) {
        this.bankAccounts = this.bankAccounts.filter(a => a.id !== account.id);
        this.calculateTotals();
        Swal.fire('Deleted!', '', 'success');
      }
    });
  }

  closeBankModal(): void {
    this.showBankModal = false;
  }

  // Cash Methods
  openAddCashModal(): void {
    this.isEditCashMode = false;
    this.currentCashAccount = { balance: 0, lastUpdated: new Date().toISOString().split('T')[0] };
    this.showCashModal = true;
  }

  openEditCashModal(account: CashAccount): void {
    this.isEditCashMode = true;
    this.currentCashAccount = { ...account };
    this.showCashModal = true;
  }

  saveCashAccount(): void {
    if (!this.currentCashAccount.accountName) {
      Swal.fire('Error', 'Please fill all required fields', 'warning');
      return;
    }

    if (this.isEditCashMode) {
      const index = this.cashAccounts.findIndex(a => a.id === this.currentCashAccount.id);
      if (index !== -1) this.cashAccounts[index] = this.currentCashAccount as CashAccount;
      Swal.fire('Success', 'Cash account updated', 'success');
    } else {
      this.cashAccounts.push({ id: this.cashAccounts.length + 1, ...this.currentCashAccount } as CashAccount);
      Swal.fire('Success', 'Cash account added', 'success');
    }
    this.calculateTotals();
    this.closeCashModal();
  }

  deleteCashAccount(account: CashAccount): void {
    Swal.fire({
      title: 'Delete?',
      text: `Delete ${account.accountName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes'
    }).then((result) => {
      if (result.isConfirmed) {
        this.cashAccounts = this.cashAccounts.filter(a => a.id !== account.id);
        this.calculateTotals();
        Swal.fire('Deleted!', '', 'success');
      }
    });
  }

  closeCashModal(): void {
    this.showCashModal = false;
  }

  // Gateway Methods
  openAddGatewayModal(): void {
    this.isEditGatewayMode = false;
    this.currentGateway = { status: 'Active', transactionFee: 0 };
    this.showGatewayModal = true;
  }

  openEditGatewayModal(gateway: PaymentGateway): void {
    this.isEditGatewayMode = true;
    this.currentGateway = { ...gateway };
    this.showGatewayModal = true;
  }

  saveGateway(): void {
    if (!this.currentGateway.gatewayName) {
      Swal.fire('Error', 'Please fill all required fields', 'warning');
      return;
    }

    if (this.isEditGatewayMode) {
      const index = this.paymentGateways.findIndex(g => g.id === this.currentGateway.id);
      if (index !== -1) this.paymentGateways[index] = this.currentGateway as PaymentGateway;
      Swal.fire('Success', 'Gateway updated', 'success');
    } else {
      this.paymentGateways.push({ id: this.paymentGateways.length + 1, ...this.currentGateway } as PaymentGateway);
      Swal.fire('Success', 'Gateway added', 'success');
    }
    this.closeGatewayModal();
  }

  deleteGateway(gateway: PaymentGateway): void {
    Swal.fire({
      title: 'Delete?',
      text: `Delete ${gateway.gatewayName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes'
    }).then((result) => {
      if (result.isConfirmed) {
        this.paymentGateways = this.paymentGateways.filter(g => g.id !== gateway.id);
        Swal.fire('Deleted!', '', 'success');
      }
    });
  }

  closeGatewayModal(): void {
    this.showGatewayModal = false;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
  }

  getStatusClass(status: string): string {
    return status === 'Active' ? 'bg-success-focus text-success-main px-12 py-4 radius-4 fw-medium text-sm' : 'bg-danger-focus text-danger-main px-12 py-4 radius-4 fw-medium text-sm';
  }
}