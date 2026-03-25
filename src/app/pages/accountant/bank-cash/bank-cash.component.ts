import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { finalize } from 'rxjs';
import { BankAccount, BankAccountService } from '../../../services/bank-account.service';
import { PaymentGatewaySetting, PaymentGatewayService } from '../../../services/payment-gateway.service';

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
  cashAccounts: BankAccount[] = [];
  showCashModal = false;
  isEditCashMode = false;
  currentCashAccount: Partial<BankAccount> = {};

  // Payment Gateways
  paymentGateways: PaymentGatewaySetting[] = [];
  showGatewayModal = false;
  isEditGatewayMode = false;
  currentGateway: Partial<PaymentGatewaySetting> = {};

  // Totals
  totalBankBalance = 0;
  totalCashBalance = 0;
  totalBalance = 0;

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  showDeleteDialog = false;
  itemToDeleteId: number | null = null;
  itemToDeleteDesc = '';
  deleteTarget: 'bank' | 'cash' | 'gateway' = 'bank';

  // ── Helpers ──
  triggerSuccess(title: string, msg: string) {
    this.feedbackType = 'success'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerError(title: string, msg: string) {
    this.feedbackType = 'error'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  closeFeedback() { this.showFeedbackModal = false; }

  constructor(
    private bankAccountService: BankAccountService,
    private gatewayService: PaymentGatewayService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.bankAccountService.getBankAccounts().subscribe(data => {
      this.bankAccounts = data.filter(a => a.accountType === 'Bank');
      this.cashAccounts = data.filter(a => a.accountType === 'Cash');
      this.calculateTotals();
    });

    this.gatewayService.getGateways().subscribe(data => {
      this.paymentGateways = data;
    });
  }

  calculateTotals(): void {
    this.totalBankBalance = this.bankAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    this.totalCashBalance = this.cashAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    this.totalBalance = this.totalBankBalance + this.totalCashBalance;
  }

  // --- Bank Methods ---
  openAddBankModal(): void {
    this.isEditBankMode = false;
    this.currentBankAccount = { accountType: 'Bank', isActive: true, balance: 0 };
    this.showBankModal = true;
  }

  openEditBankModal(account: BankAccount): void {
    this.isEditBankMode = true;
    this.currentBankAccount = { ...account };
    this.showBankModal = true;
  }

  saveBankAccount(): void {
    const account = this.currentBankAccount as BankAccount;
    if (!account.accountName || !account.accountNumber) {
      this.triggerError('Error', 'Please fill all required fields');
      return;
    }
    account.accountType = 'Bank';

    this.isProcessing = true;
    if (this.isEditBankMode) {
      this.bankAccountService.updateBankAccount(account.bankAccountId, account)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Updated!', 'Bank account updated');
            this.loadData();
            this.closeBankModal();
          },
          error: () => this.triggerError('Error', 'Failed to update bank account')
        });
    } else {
      this.bankAccountService.createBankAccount(account)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Added!', 'Bank account added');
            this.loadData();
            this.closeBankModal();
          },
          error: () => this.triggerError('Error', 'Failed to add bank account')
        });
    }
  }

  deleteBankAccount(account: BankAccount): void {
    this.itemToDeleteId = account.bankAccountId;
    this.itemToDeleteDesc = account.accountName;
    this.deleteTarget = account.accountType === 'Cash' ? 'cash' : 'bank';
    this.showDeleteDialog = true;
  }

  executeDelete() {
    if (this.itemToDeleteId === null) return;
    this.showDeleteDialog = false;
    this.isProcessing = true;

    if (this.deleteTarget === 'gateway') {
      this.gatewayService.deleteGateway(this.itemToDeleteId)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Deleted!', 'Gateway has been removed.');
            this.loadData();
          },
          error: () => this.triggerError('Error', 'Failed to delete gateway')
        });
    } else {
      this.bankAccountService.deleteBankAccount(this.itemToDeleteId)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Deleted!', (this.deleteTarget === 'bank' ? 'Bank account' : 'Cash account') + ' deleted');
            this.loadData();
          },
          error: () => this.triggerError('Error', 'Failed to delete account')
        });
    }
  }

  closeBankModal(): void { this.showBankModal = false; }


  // --- Cash Methods ---
  openAddCashModal(): void {
    this.isEditCashMode = false;
    this.currentCashAccount = { accountType: 'Cash', isActive: true, balance: 0, bankName: 'Cash', accountNumber: 'CASH-' + Date.now() };
    this.showCashModal = true;
  }

  openEditCashModal(account: BankAccount): void {
    this.isEditCashMode = true;
    this.currentCashAccount = { ...account };
    this.showCashModal = true;
  }

  saveCashAccount(): void {
    const account = this.currentCashAccount as BankAccount;
    if (!account.accountName) {
      this.triggerError('Error', 'Please fill name');
      return;
    }
    account.accountType = 'Cash';

    this.isProcessing = true;
    if (this.isEditCashMode) {
      this.bankAccountService.updateBankAccount(account.bankAccountId, account)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Updated!', 'Cash account updated');
            this.loadData();
            this.closeCashModal();
          },
          error: () => this.triggerError('Error', 'Failed to update cash account')
        });
    } else {
      this.bankAccountService.createBankAccount(account)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Added!', 'Cash account added');
            this.loadData();
            this.closeCashModal();
          },
          error: () => this.triggerError('Error', 'Failed to add cash account')
        });
    }
  }

  deleteCashAccount(account: BankAccount): void {
    this.deleteBankAccount(account);
  }

  closeCashModal(): void { this.showCashModal = false; }


  // --- Gateway Methods ---
  openAddGatewayModal(): void {
    this.isEditGatewayMode = false;
    this.currentGateway = { isActive: true, isTestMode: true };
    this.showGatewayModal = true;
  }

  openEditGatewayModal(gateway: PaymentGatewaySetting): void {
    this.isEditGatewayMode = true;
    this.currentGateway = { ...gateway };
    this.showGatewayModal = true;
  }

  saveGateway(): void {
    const gw = this.currentGateway as PaymentGatewaySetting;
    if (!gw.gatewayName) {
      this.triggerError('Error', 'Please fill required fields');
      return;
    }

    this.isProcessing = true;
    if (this.isEditGatewayMode) {
      this.gatewayService.updateGateway(gw.id, gw)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Updated!', 'Gateway settings updated');
            this.loadData();
            this.closeGatewayModal();
          },
          error: () => this.triggerError('Error', 'Failed to update gateway')
        });
    } else {
      this.gatewayService.createGateway(gw)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.triggerSuccess('Added!', 'Gateway settings added');
            this.loadData();
            this.closeGatewayModal();
          },
          error: () => this.triggerError('Error', 'Failed to add gateway')
        });
    }
  }

  deleteGateway(gateway: PaymentGatewaySetting): void {
    this.itemToDeleteId = gateway.id;
    this.itemToDeleteDesc = gateway.gatewayName;
    this.deleteTarget = 'gateway';
    this.showDeleteDialog = true;
  }

  closeGatewayModal(): void { this.showGatewayModal = false; }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
  }

  getInitial(name: string | undefined): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}


