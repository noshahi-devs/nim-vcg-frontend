import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';
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
    if (!this.currentBankAccount.accountName || !this.currentBankAccount.accountNumber) {
      Swal.fire('Error', 'Please fill all required fields', 'warning');
      return;
    }

    const account = this.currentBankAccount as BankAccount;
    account.accountType = 'Bank';

    if (this.isEditBankMode) {
      this.bankAccountService.updateBankAccount(account.bankAccountId, account).subscribe(() => {
        Swal.fire('Success', 'Bank account updated', 'success');
        this.loadData();
        this.closeBankModal();
      });
    } else {
      this.bankAccountService.createBankAccount(account).subscribe(() => {
        Swal.fire('Success', 'Bank account added', 'success');
        this.loadData();
        this.closeBankModal();
      });
    }
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
        this.bankAccountService.deleteBankAccount(account.bankAccountId).subscribe(() => {
          Swal.fire('Deleted!', '', 'success');
          this.loadData();
        });
      }
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
    if (!this.currentCashAccount.accountName) {
      Swal.fire('Error', 'Please fill name', 'warning');
      return;
    }
    const account = this.currentCashAccount as BankAccount;
    account.accountType = 'Cash';

    if (this.isEditCashMode) {
      this.bankAccountService.updateBankAccount(account.bankAccountId, account).subscribe(() => {
        Swal.fire('Success', 'Cash account updated', 'success');
        this.loadData();
        this.closeCashModal();
      });
    } else {
      this.bankAccountService.createBankAccount(account).subscribe(() => {
        Swal.fire('Success', 'Cash account added', 'success');
        this.loadData();
        this.closeCashModal();
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
    if (!this.currentGateway.gatewayName) {
      Swal.fire('Error', 'Please fill required fields', 'warning');
      return;
    }
    const gw = this.currentGateway as PaymentGatewaySetting;

    if (this.isEditGatewayMode) {
      this.gatewayService.updateGateway(gw.id, gw).subscribe(() => {
        Swal.fire('Success', 'Gateway updated', 'success');
        this.loadData();
        this.closeGatewayModal();
      });
    } else {
      this.gatewayService.createGateway(gw).subscribe(() => {
        Swal.fire('Success', 'Gateway added', 'success');
        this.loadData();
        this.closeGatewayModal();
      });
    }
  }

  deleteGateway(gateway: PaymentGatewaySetting): void {
    this.gatewayService.deleteGateway(gateway.id).subscribe(() => {
      Swal.fire('Deleted', '', 'success');
      this.loadData();
    });
  }

  closeGatewayModal(): void { this.showGatewayModal = false; }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', minimumFractionDigits: 0 }).format(amount);
  }
}
