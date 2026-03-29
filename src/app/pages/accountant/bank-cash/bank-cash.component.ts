import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { finalize } from 'rxjs';
import { BankAccount, BankAccountService } from '../../../services/bank-account.service';
import { PaymentGatewaySetting, PaymentGatewayService } from '../../../services/payment-gateway.service';
import { PopupService } from '../../../services/popup.service';

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
  isProcessing = false;


  // ── Helpers ──
  closeFeedback() { }

  constructor(
    private bankAccountService: BankAccountService,
    private gatewayService: PaymentGatewayService,
    private popup: PopupService
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
      this.popup.warning('Incomplete Form', 'Please fill all required account details.');
      return;
    }
    account.accountType = 'Bank';

    this.isProcessing = true;
    this.closeBankModal();
    this.popup.loading(this.isEditBankMode ? 'Updating bank account...' : 'Adding new bank account...');
    if (this.isEditBankMode) {
      this.bankAccountService.updateBankAccount(account.bankAccountId, account)
        .pipe(finalize(() => {
          this.isProcessing = false;
        }))
        .subscribe({
          next: () => {
            this.popup.success('Updated!', 'Bank account details updated.');
            this.loadData();
          },
          error: () => this.popup.error('Update Failed', 'Could not update bank account.')
        });
    } else {
      this.bankAccountService.createBankAccount(account)
        .pipe(finalize(() => {
          this.isProcessing = false;
        }))
        .subscribe({
          next: () => {
            this.popup.success('Added!', 'New bank account registered.');
            this.loadData();
          },
          error: () => this.popup.error('Save Failed', 'Could not register bank account.')
        });
    }
  }

  deleteBankAccount(account: BankAccount): void {
    const typeLabel = account.accountType === 'Cash' ? 'cash account' : 'bank account';
    this.popup.confirm(
      'Are you sure?',
      `Do you want to delete the ${typeLabel}: "${account.accountName}"?`
    ).then(isConfirmed => {
      if (isConfirmed) {
        this.executeDelete(account.bankAccountId, typeLabel);
      }
    });
  }

  executeDelete(id: number, typeLabel: string) {
    this.isProcessing = true;
    this.popup.loading(`Deleting ${typeLabel}...`);
    this.bankAccountService.deleteBankAccount(id)
      .pipe(finalize(() => {
        this.isProcessing = false;
      }))
      .subscribe({
        next: () => {
          this.popup.success('Deleted!', `The ${typeLabel} has been removed.`);
          this.loadData();
        },
        error: () => this.popup.error('Delete Failed', `Could not delete the ${typeLabel}.`)
      });
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
      this.popup.warning('Missing Name', 'Please provide a name for the cash account.');
      return;
    }
    account.accountType = 'Cash';

    this.isProcessing = true;
    this.closeCashModal();
    this.popup.loading(this.isEditCashMode ? 'Updating cash vault...' : 'Creating new cash vault...');
    if (this.isEditCashMode) {
      this.bankAccountService.updateBankAccount(account.bankAccountId, account)
        .pipe(finalize(() => {
          this.isProcessing = false;
        }))
        .subscribe({
          next: () => {
            this.popup.success('Updated!', 'Cash account updated.');
            this.loadData();
          },
          error: () => this.popup.error('Update Failed', 'Could not update cash account.')
        });
    } else {
      this.bankAccountService.createBankAccount(account)
        .pipe(finalize(() => {
          this.isProcessing = false;
        }))
        .subscribe({
          next: () => {
            this.popup.success('Added!', 'New cash account registered.');
            this.loadData();
          },
          error: () => this.popup.error('Save Failed', 'Could not register cash account.')
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
      this.popup.warning('Incomplete Form', 'Please provide the gateway provider name.');
      return;
    }

    this.isProcessing = true;
    this.closeGatewayModal();
    this.popup.loading(this.isEditGatewayMode ? 'Updating gateway configuration...' : 'Setting up new gateway...');
    if (this.isEditGatewayMode) {
      this.gatewayService.updateGateway(gw.id, gw)
        .pipe(finalize(() => {
          this.isProcessing = false;
        }))
        .subscribe({
          next: () => {
            this.popup.success('Updated!', 'Gateway settings optimized.');
            this.loadData();
          },
          error: () => this.popup.error('Update Failed', 'Could not update gateway configuration.')
        });
    } else {
      this.gatewayService.createGateway(gw)
        .pipe(finalize(() => {
          this.isProcessing = false;
        }))
        .subscribe({
          next: () => {
            this.popup.success('Added!', 'New payment gateway integrated.');
            this.loadData();
          },
          error: () => this.popup.error('Integration Failed', 'Could not add the payment gateway.')
        });
    }
  }

  deleteGateway(gateway: PaymentGatewaySetting): void {
    this.popup.confirm(
      'Are you sure?',
      `Do you want to remove the gateway: "${gateway.gatewayName}"?`
    ).then(isConfirmed => {
      if (isConfirmed) {
        this.executeDeleteGateway(gateway.id);
      }
    });
  }

  executeDeleteGateway(id: number) {
    this.isProcessing = true;
    this.popup.loading('Removing gateway...');
    this.gatewayService.deleteGateway(id)
      .pipe(finalize(() => {
        this.isProcessing = false;
      }))
      .subscribe({
        next: () => {
          this.popup.success('Removed!', 'Payment gateway disconnected.');
          this.loadData();
        },
        error: () => this.popup.error('Action Failed', 'Could not remove the gateway.')
      });
  }

  closeGatewayModal(): void { this.showGatewayModal = false; }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
  }

  getInitial(name: string | undefined): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }
}


