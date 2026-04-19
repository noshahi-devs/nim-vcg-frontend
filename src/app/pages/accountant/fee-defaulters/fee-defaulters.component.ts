import { Component, CUSTOM_ELEMENTS_SCHEMA, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { DueBalanceService, DueBalance } from '../../../services/due-balance.service';
import { SettingsService } from '../../../services/settings.service';
import { PopupService } from '../../../services/popup.service';

interface FeeDefaulter {
  feeId: number;
  studentName: string;
  className: string;
  section: string;
  feeType: string;
  amount: number;
  dueDate: Date;
  daysOverdue: number;
  status: 'Critical' | 'Warning' | 'Overdue';
}

@Component({
  selector: 'app-fee-defaulters',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './fee-defaulters.component.html',
  styleUrl: './fee-defaulters.component.css'
})
export class FeeDefaultersComponent implements OnInit {
  title = 'Fee Defaulters';
  Math = Math; // Template access

  // Data
  defaulters: FeeDefaulter[] = [];
  filteredDefaulters: FeeDefaulter[] = [];

  // Filters
  searchQuery: string = '';
  selectedClass: string = 'all';
  selectedStatus: string = 'all';
  minAmount: number = 0;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Analytics
  totalDefaulters: number = 0;
  totalOutstanding: number = 0;
  criticalCount: number = 0;
  warningCount: number = 0;

  isProcessing = false;
  reminderDefaulter: FeeDefaulter | null = null;
  bulkMode = false;

  // Print State
  schoolInfo: any = {};
  selectedDefaulter: FeeDefaulter | null = null;

  constructor(
    private dueBalanceService: DueBalanceService,
    private settingsService: SettingsService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadSchoolInfo();
    this.loadDefaulters();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
      event.preventDefault();
      this.printTable();
    }
  }

  loadSchoolInfo() {
    this.settingsService.getSchoolInfo().subscribe(info => {
      this.schoolInfo = info || {};
    });
  }

  loadDefaulters(): void {
    this.isProcessing = true;
    console.log('🚀 FeeDefaultersComponent: loadDefaulters started');
    this.dueBalanceService.getDueBalances().subscribe({
      next: (balances) => {
        console.log('📦 FeeDefaultersComponent: Received balances:', balances);
        try {
          this.processDefaulters(balances || []);
          this.applyFilters();
          console.log('✨ FeeDefaultersComponent: Data processed successfully');
        } catch (err) {
          console.error('🔥 FeeDefaultersComponent: Error processing data:', err);
          this.popup.error('Processing Error', 'There was an error organizing the data for display.');
        }
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('❌ FeeDefaultersComponent: API Error:', error);
        this.isProcessing = false;
        this.popup.error('Failed to Load', 'Could not load data from the server. Please check your connection and try again.');
      }
    });
  }

  processDefaulters(balances: DueBalance[]): void {
    if (!balances || !Array.isArray(balances)) {
      console.warn('⚠️ FeeDefaultersComponent: balances is not an array', balances);
      this.defaulters = [];
      return;
    }

    const today = new Date();
    this.defaulters = balances
      .filter(b => b && b.dueBalanceAmount > 0)
      .map(b => {
        try {
          const lastUpdateDate = b.lastUpdate ? new Date(b.lastUpdate) : new Date();
          const daysOverdue = isNaN(lastUpdateDate.getTime())
            ? 0
            : Math.floor((today.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24));

          let status: 'Critical' | 'Warning' | 'Overdue';
          if (daysOverdue > 30) status = 'Critical';
          else if (daysOverdue > 15) status = 'Warning';
          else status = 'Overdue';

          return {
            feeId: b.dueBalanceId,
            studentName: b.student ? b.student.studentName : 'Unknown Student',
            className: b.student?.standard?.standardName || 'N/A',
            section: 'A', // Defaulting
            feeType: 'Tuition Fee',
            amount: b.dueBalanceAmount,
            dueDate: (b.lastUpdate || today.toISOString()) as any,
            daysOverdue: daysOverdue < 0 ? 0 : daysOverdue,
            status
          };
        } catch (mapError) {
          console.error('💀 Error mapping individual balance record:', b, mapError);
          return null;
        }
      })
      .filter(d => d !== null) as FeeDefaulter[];

    console.log('✅ Final Mapped Defaulters:', this.defaulters.length);
  }


  applyFilters(): void {
    this.filteredDefaulters = this.defaulters.filter(d => {
      const matchesSearch = !this.searchQuery ||
        d.studentName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        d.className.toLowerCase().includes(this.searchQuery.toLowerCase());

      const matchesClass = this.selectedClass === 'all' || d.className === this.selectedClass;
      const matchesStatus = this.selectedStatus === 'all' || d.status === this.selectedStatus;
      const matchesAmount = d.amount >= this.minAmount;

      return matchesSearch && matchesClass && matchesStatus && matchesAmount;
    });

    this.calculateAnalytics();
    this.currentPage = 1;
  }

  calculateAnalytics(): void {
    this.totalDefaulters = this.filteredDefaulters.length;
    this.totalOutstanding = this.filteredDefaulters.reduce((sum, d) => sum + d.amount, 0);
    this.criticalCount = this.filteredDefaulters.filter(d => d.status === 'Critical').length;
    this.warningCount = this.filteredDefaulters.filter(d => d.status === 'Warning').length;
  }

  get paginatedDefaulters(): FeeDefaulter[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredDefaulters.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredDefaulters.length / this.itemsPerPage));
  }

  get uniqueClasses(): string[] {
    return [...new Set(this.defaulters.map(d => d.className))];
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  confirmReminder(): void {
    const target = this.bulkMode ? `${this.filteredDefaulters.length} students` : `${this.reminderDefaulter?.studentName}`;
    this.popup.loading('Sending reminders...');

    // Simulate API call for reminder
    setTimeout(() => {
      this.popup.success('Reminders Sent', `The payment reminder has been sent successfully to ${target}.`);
    }, 1500);
  }

  sendReminder(defaulter: FeeDefaulter): void {
    this.reminderDefaulter = defaulter;
    this.bulkMode = false;

    this.popup.confirm(
      'Send Reminder?',
      `Are you sure you want to send a payment reminder to <strong>${defaulter.studentName}</strong>?`,
      'Send Now',
      'Cancel',
      'reminder'
    ).then(confirmed => {
      if (confirmed) this.confirmReminder();
    });
  }

  sendBulkReminders(): void {
    if (this.filteredDefaulters.length === 0) return;
    this.bulkMode = true;

    this.popup.confirm(
      'Bulk Notification?',
      `Are you sure you want to send payment reminders to all <strong>${this.filteredDefaulters.length}</strong> filtered students?`,
      'Send Now',
      'Cancel',
      'reminder'
    ).then(confirmed => {
      if (confirmed) this.confirmReminder();
    });
  }

  printTable(): void {
    const schoolName = this.schoolInfo?.schoolName || 'Vision College';
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    const rows = this.filteredDefaulters.map((d, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${d.studentName}</td>
        <td>${d.className} - ${d.section}</td>
        <td>${d.feeType}</td>
        <td class="text-right">Rs. ${d.amount.toLocaleString()}</td>
        <td>${new Date(d.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
        <td>${d.daysOverdue} Days</td>
        <td><span class="status ${d.status.toLowerCase()}">${d.status}</span></td>
      </tr>
    `).join('');

    const totalAmount = this.filteredDefaulters.reduce((s, d) => s + d.amount, 0);

    const html = `<!DOCTYPE html>
<html><head><title>Fee Defaulters - ${schoolName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: white; color: #000; padding: 20px; }
  @page { margin: 10mm; size: A4 portrait; }
  .report-header { display: flex; align-items: center; gap: 14px; border-bottom: 3px solid #800000; padding-bottom: 12px; margin-bottom: 20px; }
  .report-header img { height: 50px; }
  .report-header h1 { color: #800000; font-size: 20px; margin: 0; }
  .report-header .campus { font-size: 11px; font-weight: 700; color: #800000; letter-spacing: 1px; }
  .report-meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 12px; color: #475569; }
  .report-meta strong { color: #1e293b; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th { background: #800000; color: white; padding: 8px 10px; text-align: left; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) { background: #f8fafc; }
  .text-right { text-align: right; }
  .status { padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .status.critical { background: #fee2e2; color: #b91c1c; }
  .status.warning { background: #fffbeb; color: #b45309; }
  .status.overdue { background: #eff6ff; color: #1d4ed8; }
  tfoot td { font-weight: 800; border-top: 2px solid #800000; background: #fef2f2; font-size: 12px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head>
<body>
  <div class="report-header">
    <img src="assets/images/Vision College emblem design.png" alt="Logo" onerror="this.style.display='none'">
    <div>
      <h1>${schoolName}</h1>
      <p class="campus">GOJRA CAMPUS</p>
      <!-- Action Buttons -->
      <div class="col-lg-3 col-md-12 d-flex gap-2">
        <button class="btn-primary-premium w-100" (click)="syncData()">
          <iconify-icon icon="solar:refresh-circle-bold" class="me-2"></iconify-icon> Sync All Balances
        </button>
      </div>
    </div>
  </div>
  <div class="report-meta">
    <span><strong>Report:</strong> Fee Defaulters List</span>
    <span><strong>Total Records:</strong> ${this.filteredDefaulters.length}</span>
    <span><strong>Date:</strong> ${today}</span>
  </div>
  <table>
    <thead><tr>
      <th>#</th><th>Student</th><th>Class</th><th>Fee Type</th><th class="text-right">Amount</th><th>Due Date</th><th>Overdue</th><th>Status</th>
    </tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr>
      <td colspan="4" class="text-right"><strong>Grand Total:</strong></td>
      <td class="text-right"><strong>Rs. ${totalAmount.toLocaleString()}</strong></td>
      <td colspan="3"></td>
    </tr></tfoot>
  </table>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  }

  printVoucher(defaulter: FeeDefaulter): void {
    // Print voucher for a SINGLE student
    this.openVoucherWindow([defaulter]);
  }

  private openVoucherWindow(defaulters: FeeDefaulter[]): void {
    const schoolName = this.schoolInfo?.schoolName || 'Vision College';
    const schoolAddress = this.schoolInfo?.address || 'Main Campus';
    const logoUrl = this.schoolInfo?.logoUrl || 'assets/images/logo.png';
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    let vouchersHtml = '';
    for (const d of defaulters) {
      const totalPayable = d.status === 'Critical' ? d.amount + 500 : d.amount;
      const fineRow = d.status === 'Critical'
        ? `<tr><td>Late Fee Fine</td><td class="text-right">500</td></tr>` : '';

      const voucherParts = ['Bank Copy', 'Office Copy', 'Student Copy'].map(copyName => `
        <div class="voucher-part">
          <div class="v-header">
            <img src="assets/images/Vision College emblem design.png" alt="Logo" class="v-logo" onerror="this.style.display='none'">
            <div class="v-school-info">
              <h2>${schoolName}</h2>
              <p class="v-campus">GOJRA CAMPUS</p>
            </div>
          </div>
          <div class="v-title-bar">
            <span class="v-copy-tag">${copyName}</span>
            <span class="v-date">Date: ${today}</span>
          </div>
          <div class="v-student-panel">
            <div class="v-row"><strong>Name:</strong> <span>${d.studentName}</span></div>
            <div class="v-row"><strong>Class:</strong> <span>${d.className} (${d.section})</span></div>
            <div class="v-row"><strong>Status:</strong> <span>${d.status}</span></div>
          </div>
          <table class="v-table">
            <thead><tr><th>Particulars</th><th class="text-right">Amount (Rs.)</th></tr></thead>
            <tbody>
              <tr><td>Outstanding Dues (${d.feeType})</td><td class="text-right">${d.amount.toLocaleString()}</td></tr>
              ${fineRow}
              <tr><td>&nbsp;</td><td>&nbsp;</td></tr>
            </tbody>
            <tfoot><tr>
              <td class="text-right"><strong>Total Payable:</strong></td>
              <td class="text-right"><strong>Rs. ${totalPayable.toLocaleString()}</strong></td>
            </tr></tfoot>
          </table>
          <div class="v-bank-info">
            <p><strong>Bank:</strong> Habib Bank Limited (HBL)</p>
            <p><strong>A/C Title:</strong> ${schoolName}</p>
            <p><strong>A/C No:</strong> 0123-4567890-11</p>
          </div>
          <div class="v-footer">
            <div class="v-sig"><div class="v-line"></div><span>Cashier</span></div>
            <div class="v-sig"><div class="v-line"></div><span>Officer</span></div>
          </div>
        </div>
      `).join('');

      vouchersHtml += `<div class="voucher-wrapper">${voucherParts}</div>`;
    }

    const html = `<!DOCTYPE html>
<html><head><title>Fee Voucher - ${schoolName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: white; color: #000; }
  @page { margin: 5mm; size: A4 landscape; }
  .voucher-wrapper {
    display: flex; justify-content: space-between; gap: 12px;
    width: 100%; padding: 8mm 5mm; page-break-after: always;
  }
  .voucher-wrapper:last-child { page-break-after: auto; }
  .voucher-part {
    flex: 1; border: 1.5px dashed #94a3b8; padding: 14px;
    font-size: 11px; border-radius: 4px;
  }
  .v-header {
    display: flex; align-items: center; border-bottom: 2.5px solid #800000;
    padding-bottom: 8px; margin-bottom: 10px; gap: 10px;
  }
  .v-logo { height: 38px; width: auto; }
  .v-school-info h2 { color: #800000; font-size: 15px; font-weight: 800; margin: 0; }
  .v-campus { font-size: 10px; font-weight: 700; color: #800000; letter-spacing: 1px; margin: 1px 0 0 !important; }
  .v-school-info p { font-size: 9px; margin: 2px 0 0; color: #64748b; }
  .v-title-bar {
    display: flex; justify-content: space-between; align-items: center;
    background: #f1f5f9; padding: 5px 10px; font-weight: bold;
    margin-bottom: 10px; border-radius: 4px; font-size: 11px;
  }
  .v-copy-tag { text-transform: uppercase; letter-spacing: 0.5px; color: #800000; }
  .v-date { font-weight: 600; color: #475569; }
  .v-student-panel { margin-bottom: 12px; }
  .v-row { padding: 3px 0; font-size: 12px; }
  .v-row strong { display: inline-block; width: 55px; color: #475569; }
  .v-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .v-table th, .v-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
  .v-table th { background: #f8fafc; text-align: left; font-weight: 700; }
  .v-table tfoot td { background: #fef2f2; font-size: 12px; }
  .text-right { text-align: right !important; }
  .v-bank-info {
    background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px;
    border-radius: 4px; margin-bottom: 16px;
  }
  .v-bank-info p { margin: 2px 0; font-size: 10px; }
  .v-footer { display: flex; justify-content: space-between; margin-top: 15px; }
  .v-sig { text-align: center; width: 80px; }
  .v-line { border-bottom: 1px solid #000; height: 20px; margin-bottom: 4px; }
  .v-sig span { font-size: 10px; color: #64748b; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style></head>
<body>${vouchersHtml}</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  }

  exportCSV(): void {
    const headers = ['Student Name', 'Class', 'Section', 'Fee Type', 'Amount', 'Due Date', 'Days Overdue', 'Status'];
    const rows = this.filteredDefaulters.map(d => [
      d.studentName,
      d.className,
      d.section,
      d.feeType,
      d.amount.toString(),
      new Date(d.dueDate).toLocaleDateString(),
      d.daysOverdue.toString(),
      d.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fee_defaulters_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportPDF(): void {
    this.popup.warning('Feature Unavailable', 'PDF generation for financial reports is currently being optimized for high-resolution printing.');
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }
}


