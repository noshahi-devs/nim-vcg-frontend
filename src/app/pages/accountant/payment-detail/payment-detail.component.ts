import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonServices } from '../../../services/common.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { MonthlyPayment } from '../../../Models/monthly-payment';
import { OthersPayment } from '../../../Models/other-payment';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { Router } from '@angular/router';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent]

})
export class PaymentDetailComponent implements OnInit {

  title = 'Payment Details';
  Math = Math; // Template access

  standards: Standard[] = [];
  students: Student[] = [];
  filteredStudents: Student[] = [];

  studentId: any = '';
  selectedStandardId: any = '';

  payments: MonthlyPayment[] = [];
  otherPayments: OthersPayment[] = [];

  // Unified pagination/search
  activeTab: 'monthly' | 'other' = 'monthly';
  filteredMonthly: MonthlyPayment[] = [];
  filteredOther: OthersPayment[] = [];
  paginatedData: any[] = [];

  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  toEntry = 0;
  searchTerm = '';
  statusFilter: 'all' | 'paid' | 'pending' = 'all';
  isProcessing = false;

  selectedPayment: any = null;
  paymentToDelete: any = null;

  showViewDialog = false;

  constructor(
    private commonService: CommonServices,
    private router: Router,
    private popup: PopupService
  ) { }
  
  getStudentPhone(student: any): string {
    if (!student) return '-';
    return [student.guardianPhone, student.studentContactNumber1]
      .filter(num => num && num.trim() !== '')
      .join(' / ') || '-';
  }

  ngOnInit(): void {
    this.fetchStandards();
    this.isProcessing = true;
    this.commonService.getAllStudents().subscribe({
      next: r => {
        this.students = r;
        this.filteredStudents = r;
        this.getPayments();
        this.getOtherPayments();
      },
      error: () => {
        this.isProcessing = false;
        this.popup.error('Sync Failed', 'Unable to retrieve student directory.');
      }
    });
  }

  goToAddPayment() {
    if (!this.studentId || !this.selectedStandardId) return;
    if (this.activeTab === 'monthly') {
      this.router.navigate(['/monthly-payment'], { queryParams: { classId: this.selectedStandardId, studentId: this.studentId, action: 'add' } });
    } else {
      this.router.navigate(['/other-payment'], { queryParams: { classId: this.selectedStandardId, studentId: this.studentId, action: 'add' } });
    }
  }

  /* ---------- GETTERS (STATS) ---------- */
  get totalMonthlyCollected() {
    return this.filteredMonthly.reduce((a, b) => a + (b.amountPaid || 0), 0);
  }
  get totalOtherCollected() {
    return this.filteredOther.reduce((a, b) => a + (b.amountPaid || 0), 0);
  }
  get totalPending() {
    const monthlyRemaining = this.filteredMonthly.reduce((a, b) => a + (b.amountRemaining || 0), 0);
    const otherRemaining = this.filteredOther.reduce((a, b) => a + (b.amountRemaining || 0), 0);
    return monthlyRemaining + otherRemaining;
  }
  get totalTransactions() {
    return this.filteredMonthly.length + this.filteredOther.length;
  }

  /* ---------- DATA FETCHING ---------- */
  fetchStandards() {
    this.commonService.getAllStandards().subscribe(r => this.standards = r);
  }

  fetchStudents() {
    // This is now called within ngOnInit for initial load
    // But can still be called manually to refresh
    this.commonService.getAllStudents().subscribe({
      next: r => {
        this.students = r;
        this.filteredStudents = r;
        this.applyFilter();
      }
    });
  }

  onStandardChange() {
    if (this.selectedStandardId) {
      this.filteredStudents = this.students.filter(s => s.standardId === parseInt(this.selectedStandardId));
    } else {
      this.filteredStudents = this.students;
    }
    this.studentId = ''; // Reset student selection
    this.applyFilter(); // Filter payments by class
  }

  onSubmit() {
    if (!this.studentId) return;
    this.currentPage = 1;
    this.getPayments();
    this.getOtherPayments();
  }

  getPayments() {
    this.isProcessing = true;
    const request = this.studentId 
      ? this.commonService.getAllPaymentsByStudentId(this.studentId)
      : this.commonService.getAllMonthlyPayments();

    request.subscribe({
      next: r => {
        this.payments = r.map(p => ({
          ...p,
          student: this.students.find(s => s.studentId === p.studentId) || p.student
        }));
        this.isProcessing = false;
        this.applyFilter();
      },
      error: (err: any) => {
        this.isProcessing = false;
        if (err.status === 404) {
          this.payments = [];
          this.applyFilter();
        } else {
          this.popup.error('Fetch Error', 'Failed to load monthly payment history.');
        }
      }
    });
  }

  getOtherPayments() {
    this.isProcessing = true;
    const request = this.studentId 
      ? this.commonService.getAllOtherPaymentsByStudentId(this.studentId)
      : this.commonService.getAllOthersPayments();

    request.subscribe({
      next: r => {
        this.otherPayments = r.map(p => ({
          ...p,
          student: this.students.find(s => s.studentId === p.studentId) || p.student
        }));
        this.isProcessing = false;
        this.applyFilter();
      },
      error: (err: any) => {
        this.isProcessing = false;
        if (err.status === 404) {
          this.otherPayments = [];
          this.applyFilter();
        } else {
          this.popup.error('Fetch Error', 'Failed to load miscellaneous payment history.');
        }
      }
    });
  }



  /* ---------- FILTER & PAGINATION ---------- */
  setTab(tab: 'monthly' | 'other') {
    this.activeTab = tab;
    this.currentPage = 1;
    this.applyFilter();
  }

  searchPayments() {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();
    const classId = this.selectedStandardId ? parseInt(this.selectedStandardId) : null;

    const filterFn = (p: any) => {
      // Search Term
      const matchesSearch = !term || 
        p.student?.studentName?.toLowerCase().includes(term) || 
        (p.monthlyPaymentId || p.othersPaymentId)?.toString().includes(term);
      
      // Class Filter
      const matchesClass = !classId || p.student?.standardId === classId;

      // Student Filter (if explicitly selected)
      const matchesStudent = !this.studentId || p.studentId === parseInt(this.studentId);

      // Status Filter
      let matchesStatus = true;
      if (this.statusFilter === 'paid') {
        matchesStatus = p.amountRemaining === 0;
      } else if (this.statusFilter === 'pending') {
        matchesStatus = p.amountRemaining > 0;
      }

      return matchesSearch && matchesClass && matchesStudent && matchesStatus;
    };

    // Filter Monthly
    this.filteredMonthly = this.payments.filter(filterFn);

    // Filter Other
    this.filteredOther = this.otherPayments.filter(filterFn);

    this.updatePagination();
  }

  updatePagination() {
    const currentList = this.activeTab === 'monthly' ? this.filteredMonthly : this.filteredOther;
    this.totalPages = Math.max(1, Math.ceil(currentList.length / this.rowsPerPage));
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedData = currentList.slice(start, start + this.rowsPerPage);
    this.toEntry = Math.min(start + this.rowsPerPage, currentList.length);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ---------- MODALS & ACTIONS ---------- */
  openViewDialog(payment: any) {
    this.selectedPayment = payment;
    this.showViewDialog = true;
  }

  closeDialog() {
    this.showViewDialog = false;
    this.selectedPayment = null;
  }

  printReceipt(payment: any) {
    if (!payment) return;
    const schoolName = 'Vision College';
    const today = new Date(payment.paymentDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const className = payment.student?.standard?.standardName || '--';
    const phone = this.getStudentPhone(payment.student);

    const baseTotal = payment.totalFeeAmount || payment.totalAmount || 0;
    const waver = payment.waver || payment.discount || 0;
    const discountAmt = (baseTotal * waver) / 100;
    
    // Rows
    let rowsHtml = '';
    
    if (this.activeTab === 'monthly') {
      if (payment.fees?.length) {
         rowsHtml += `<tr><td>Fees: ${payment.fees.map((f:any)=> f.feeType?.typeName).join(', ')}</td><td class="text-right">${baseTotal.toLocaleString()}</td></tr>`;
      }
      if (payment.academicMonths?.length) {
         rowsHtml += `<tr><td>Months: ${payment.academicMonths.map((m:any) => m.monthName).join(', ')}</td><td class="text-right">-</td></tr>`;
      }
    } else {
      if (payment.feeStructure?.feeType?.typeName) {
         rowsHtml += `<tr><td>Fee Category: ${payment.feeStructure.feeType.typeName}</td><td class="text-right">${baseTotal.toLocaleString()}</td></tr>`;
      } else if (payment.monthlyPaymentId) {
         rowsHtml += `<tr><td>Fees: ${payment.fees?.map((f:any)=> f.feeType?.typeName).join(', ') || 'Monthly Fee'}</td><td class="text-right">${baseTotal.toLocaleString()}</td></tr>`;
      }
      if (payment.applicableFees?.length) {
         rowsHtml += `<tr><td>Applicable: ${payment.applicableFees.join(', ')}</td><td class="text-right">-</td></tr>`;
      }
      if (payment.academicMonths?.length) {
         rowsHtml += `<tr><td>Months: ${payment.academicMonths.map((m:any) => typeof m === 'string' ? m : m.monthName).join(', ')}</td><td class="text-right">-</td></tr>`;
      }
    }
    
    if(!rowsHtml) rowsHtml = `<tr><td>Payment Details</td><td class="text-right">${baseTotal.toLocaleString()}</td></tr>`;
    rowsHtml += `<tr><td>&nbsp;</td><td>&nbsp;</td></tr>`;

    // Footer
    let tfootHtml = '';
    if (waver > 0) {
      tfootHtml += `<tr><td class="text-right"><strong>Subtotal:</strong></td><td class="text-right">Rs. ${baseTotal.toLocaleString()}</td></tr>`;
      tfootHtml += `<tr><td class="text-right"><strong>Discount (${waver}%):</strong></td><td class="text-right">- Rs. ${discountAmt.toLocaleString()}</td></tr>`;
    }
    tfootHtml += `<tr><td class="text-right"><strong>Amount Paid:</strong></td><td class="text-right"><strong>Rs. ${(payment.amountPaid || 0).toLocaleString()}</strong></td></tr>`;
    if (payment.amountRemaining > 0) {
      tfootHtml += `<tr><td class="text-right" style="color:#d32f2f;"><strong>Remaining Dues:</strong></td><td class="text-right" style="color:#d32f2f;"><strong>Rs. ${(payment.amountRemaining || 0).toLocaleString()}</strong></td></tr>`;
    }

    const receiptId = this.activeTab === 'monthly' ? payment.monthlyPaymentId : payment.othersPaymentId;
    const receiptPrefix = this.activeTab === 'monthly' ? 'M' : 'O';
    const displayId = receiptId ? `${receiptPrefix}-${String(receiptId).padStart(4, '0')}` : 'NEW';

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
          <span style="display: flex; align-items: center; gap: 4px; font-size: 9px; padding: 2px 8px; border-radius: 4px; background: ${payment.amountRemaining === 0 ? '#dcfce7' : '#fee2e2'}; color: ${payment.amountRemaining === 0 ? '#15803d' : '#991b1b'};">
            ${payment.amountRemaining === 0 ? `
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              FULLY PAID` : `
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              PENDING`}
          </span>
          <span class="v-date">Date: ${today}</span>
        </div>
        <div class="v-student-panel">
          <div class="v-row"><strong>Receipt #:</strong> <span style="color:#800000; font-weight:bold;">${displayId}</span></div>
          <div class="v-row"><strong>Name:</strong> <span>${payment.student?.studentName || '-'}</span></div>
          <div class="v-row"><strong>Class:</strong> <span>${className}</span></div>
          <div class="v-row"><strong>Enrollment:</strong> <span>${payment.student?.enrollmentNo || '-'}</span></div>
          <div class="v-row"><strong>Phone:</strong> <span>${phone}</span></div>
        </div>
        <table class="v-table">
          <thead><tr><th>Description</th><th class="text-right">Amount (Rs.)</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot>${tfootHtml}</tfoot>
        </table>
        <div class="v-bank-footer">
          <div class="v-bank-details">
            <p><strong>Bank:</strong> Habib Bank Limited (HBL)</p>
            <p><strong>A/C Title:</strong> Vision College</p>
            <p><strong>A/C No:</strong> 0123-4567890-11</p>
          </div>
        </div>
        <div class="v-signatures">
          <div class="v-sig">Cashier</div>
          <div class="v-sig">Officer</div>
        </div>
      </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html><head><title>Payment Receipt - ${schoolName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
  body { background: white; color: #000; padding: 10px; }
  @page { size: A4 landscape; margin: 5mm; }
  .voucher-page { display: flex; gap: 10px; width: 100%; height: 95vh; page-break-after: always; }
  .voucher-page:last-child { page-break-after: avoid; }
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
  .v-title-bar {
    display: flex; justify-content: space-between; align-items: center;
    background: #f1f5f9; padding: 5px 10px; font-weight: bold;
    margin-bottom: 10px; border-radius: 4px; font-size: 11px;
  }
  .v-copy-tag { text-transform: uppercase; letter-spacing: 0.5px; color: #800000; }
  .v-date { font-weight: 600; color: #475569; }
  .v-student-panel { margin-bottom: 12px; }
  .v-row { padding: 3px 0; font-size: 12px; }
  .v-row strong { display: inline-block; width: 75px; color: #475569; }
  .v-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .v-table th, .v-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
  .v-table th { background: #f8fafc; text-align: left; font-weight: 700; color: #1e293b; }
  .text-right { text-align: right !important; }
  .v-table tfoot td { background: #fef2f2; font-size: 12px; border-top: 2px solid #800000; }
  .v-bank-footer { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; margin-bottom: 20px; }
  .v-bank-details p { margin: 2px 0; font-size: 10px; color: #1e293b; }
  .v-signatures { display: flex; justify-content: space-between; margin-top: 30px; padding: 0 10px; }
  .v-sig { border-top: 1px solid #000; width: 80px; text-align: center; padding-top: 5px; font-size: 10px; font-weight: 600; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style></head>
<body><div class="voucher-page">${voucherParts}</div></body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  }

  printPayments() {
    const schoolName = 'Vision College';
    const activeData = this.activeTab === 'monthly' ? this.filteredMonthly : this.filteredOther;
    
    if(!activeData || activeData.length === 0) {
      alert('There is no data to print.');
      return;
    }

    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const tabName = this.activeTab === 'monthly' ? 'Monthly Payments Registry' : 'Other Payments Registry';

    let tableRows = '';
    activeData.forEach((p, i) => {
      const id = this.activeTab === 'monthly' ? p.monthlyPaymentId : (p as any).othersPaymentId;
      const date = new Date(p.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const phone = this.getStudentPhone(p.student);
      tableRows += `
        <tr>
          <td style="text-align:center;">${i + 1}</td>
          <td>${id ?? '-'}</td>
          <td>${p.student?.studentName || '-'}</td>
          <td>${p.student?.enrollmentNo || '-'}</td>
          <td>${phone}</td>
          <td style="text-align:right;">${(p.totalAmount || 0).toLocaleString()}</td>
          <td style="text-align:right;">${(p.amountPaid || 0).toLocaleString()}</td>
          <td style="text-align:right;">${(p.amountRemaining || 0).toLocaleString()}</td>
          <td style="text-align:center; color: ${p.amountRemaining === 0 ? '#16a34a' : '#e11d48'}; font-weight: bold; white-space: nowrap;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
              ${p.amountRemaining === 0 ? `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                FULLY PAID` : `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                PENDING DUES`}
            </div>
          </td>
          <td style="text-align:center;">${date}</td>
        </tr>
      `;
    });

    const html = `<!DOCTYPE html>
<html><head><title>${tabName} - ${schoolName}</title>
<style>
  * { box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
  body { background: white; color: #000; padding: 20px; margin: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #800000; padding-bottom: 15px; margin-bottom: 20px; }
  .header-left { display: flex; align-items: center; gap: 15px; }
  .h-logo { height: 50px; width: auto; object-fit: contain; }
  .header-text h1 { margin: 0; color: #800000; font-size: 24px; line-height: 1.2; }
  .header-text p { margin: 4px 0 0 0; color: #475569; font-size: 14px; }
  .header-right { text-align: right; font-size: 14px; font-weight: bold; color: #1e293b; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
  th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
  tr:nth-child(even) { background-color: #f8fafc; }
  .footer { margin-top: 30px; font-size: 10px; color: #64748b; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <img src="assets/images/Vision College emblem design.png" alt="Logo" class="h-logo" onerror="this.style.display='none'">
      <div class="header-text">
        <h1>${schoolName}</h1>
        <p>${tabName}</p>
      </div>
    </div>
    <div class="header-right">
      Printed: ${today}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 50px; text-align:center;">#</th>
        <th>ID</th>
        <th>Student Name</th>
        <th>Enrollment</th>
        <th>Phone</th>
        <th style="text-align:right;">Total Amount</th>
        <th style="text-align:right;">Paid</th>
        <th style="text-align:right;">Remaining</th>
        <th style="text-align:center;">Status</th>
        <th style="text-align:center;">Date</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>
  <div class="footer">
    Generated by Noshahi Institute Manager &copy; ${new Date().getFullYear()} ${schoolName}
  </div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 300);
    }
  }

  downloadPayments() {
    const headers = ['ID', 'Student Name', 'Enrollment #', 'Total', 'Paid', 'Remaining', 'Date'];
    const currentList = this.activeTab === 'monthly' ? this.filteredMonthly : this.filteredOther;

    const rows = currentList.map(p => [
      this.activeTab === 'monthly' ? p.monthlyPaymentId : (p as any).othersPaymentId,
      p.student?.studentName,
      p.student?.enrollmentNo,
      p.totalAmount,
      p.amountPaid,
      p.amountRemaining,
      new Date(p.paymentDate).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${this.activeTab}_payments.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
