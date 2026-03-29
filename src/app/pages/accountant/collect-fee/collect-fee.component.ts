import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonServices } from '../../../services/common.service';
import { SettingsService } from '../../../services/settings.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { MonthlyPayment } from '../../../Models/monthly-payment';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AuthService } from '../../../SecurityModels/auth.service';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-collect-fee',
  standalone: true,
  templateUrl: './collect-fee.component.html',
  styleUrls: ['./collect-fee.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent]
})
export class CollectFeeComponent implements OnInit {

  title = 'Collect Fee';
  schoolInfo: any = {};

  standards: Standard[] = [];
  students: Student[] = [];
  filteredStudents: Student[] = [];

  selectedStandardId: any;
  studentId: any;
  selectedStudent: Student | null = null;

  totalFee = 0;
  paidAmount = 0;
  remainingAmount = 0;

  previousPayments: MonthlyPayment[] = [];

  // Pagination State
  paginatedPayments: MonthlyPayment[] = [];
  currentPage = 1;
  rowsPerPage = 10;
  totalPages = 1;
  toEntry = 0;
  isProcessing = false;


  paymentForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private commonService: CommonServices,
    private settingsService: SettingsService,
    private authService: AuthService,
    private popup: PopupService
  ) {
    this.paymentForm = this.fb.group({
      amountPaid: ['', [Validators.required, Validators.min(1)]],
      paymentType: ['Cash', Validators.required],
      paymentDate: [new Date().toISOString().substring(0, 10), Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadStandards();
    this.loadStudents();
    this.loadSchoolInfo();
  }

  loadSchoolInfo() {
    this.settingsService.getSchoolInfo().subscribe(info => {
      this.schoolInfo = info;
    });
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  loadStandards() {
    this.commonService.getAllStandards().subscribe(r => this.standards = r);
  }

  loadStudents() {
    this.commonService.getAllStudents().subscribe(r => {
      this.students = r;
      this.filteredStudents = r;
    });
  }

  filterStudents() {
    if (this.selectedStandardId) {
      this.filteredStudents = this.students.filter(s => s.standardId == this.selectedStandardId);
    } else {
      this.filteredStudents = this.students;
    }
    this.studentId = null;
    this.selectedStudent = null;
    this.totalFee = this.paidAmount = this.remainingAmount = 0;
    this.previousPayments = [];
  }

  loadFeeInfo() {
    if (!this.studentId) return;

    this.selectedStudent = this.students.find(s => s.studentId == this.studentId) || null;
    if (!this.selectedStudent) return;

    // Fetch existing payments
    this.commonService.getAllPaymentsByStudentId(this.studentId).subscribe({
      next: payments => {
        this.previousPayments = payments || [];
        this.totalFee = 5000; // replace this.selectedStudent.totalFee
        this.paidAmount = this.previousPayments.reduce((sum, p) => sum + p.amountPaid, 0);
        this.remainingAmount = this.totalFee - this.paidAmount;
        this.currentPage = 1;
        this.updatePagination();
      },
      error: err => {
        if (err.status === 404) {
          this.previousPayments = [];
          this.totalFee = 5000;
          this.paidAmount = 0;
          this.remainingAmount = this.totalFee;
          this.currentPage = 1;
          this.updatePagination();
        }
      }
    });
  }

  submitPayment() {
    if (!this.selectedStudent || !this.studentId || this.paymentForm.invalid) return;

    if (this.paymentForm.value.amountPaid > this.remainingAmount) {
      this.popup.warning('Irregular Amount', 'Payment cannot exceed the outstanding balance.');
      return;
    }

    this.isProcessing = true;
    this.popup.loading('Collecting fee from student...');

    const val = this.paymentForm.value;

    const newPayment: Partial<MonthlyPayment> = {
      studentId: this.selectedStudent.studentId,
      amountPaid: val.amountPaid,
      paymentDate: val.paymentDate,
      // The backend will calculate totals, dues, remaining based on StudentId and AmountPaid
      fees: [],
      academicMonths: [],
      paymentMonths: [],
      paymentDetails: [],
      dueBalances: []
    };

    this.commonService.createMonthlyPayment(newPayment as MonthlyPayment).subscribe({
      next: (savedPayment) => {
        this.isProcessing = false;
        this.popup.closeLoading();
        this.popup.success('Payment Logged', 'Fee collection has been recorded.');
        this.paymentForm.reset({ paymentDate: new Date().toISOString().substring(0, 10), paymentType: 'Cash' });
        this.loadFeeInfo();
      },
      error: (err) => {
        this.isProcessing = false;
        this.popup.closeLoading();
        console.error('Error collecting fee', err);
        this.popup.error('Entry Failed', 'Could not record the fee collection.');
      }
    });
  }

  printReceipt() {
    if (!this.selectedStudent) return;
    
    const schoolName = this.schoolInfo?.schoolName || 'Vision College';
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const student = this.selectedStudent;
    const className = this.standards.find(s => s.standardId == student.standardId)?.standardName || 'N/A';
    
    // Rows logic - showing summary for the collection
    let rowsHtml = `<tr><td>Student Fee Collection (Due Clearance)</td><td class="text-right">${this.paidAmount.toLocaleString()}</td></tr>`;
    rowsHtml += `<tr><td>&nbsp;</td><td>&nbsp;</td></tr>`;

    // Footer
    let tfootHtml = `<tr><td class="text-right"><strong>Total Paid:</strong></td><td class="text-right"><strong>Rs. ${this.paidAmount.toLocaleString()}</strong></td></tr>`;
    if (this.remainingAmount > 0) {
      tfootHtml += `<tr><td class="text-right" style="color:#d32f2f;"><strong>Remaining Dues:</strong></td><td class="text-right" style="color:#d32f2f;"><strong>Rs. ${this.remainingAmount.toLocaleString()}</strong></td></tr>`;
    }

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
          <div class="v-row"><strong>Receipt #:</strong> <span style="color:#800000; font-weight:bold;">${Date.now().toString().slice(-6)}</span></div>
          <div class="v-row"><strong>Name:</strong> <span>${student.studentName || '-'}</span></div>
          <div class="v-row"><strong>Class:</strong> <span>${className}</span></div>
          <div class="v-row"><strong>Enrollment:</strong> <span>${student.enrollmentNo || '-'}</span></div>
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
<html><head><title>Fee Voucher - ${student.studentName}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Arial, sans-serif; }
  body { background: white; color: #000; padding: 10px; }
  @page { size: A4 landscape; margin: 5mm; }
  .voucher-page { display: flex; gap: 10px; width: 100%; height: 95vh; page-break-after: always; }
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
<body><div class="voucher-page">${voucherParts}</div>
<script>window.onload = function() { window.print(); window.close(); };</script>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }

  downloadReceipt() {
    if (!this.selectedStudent) {
      this.popup.warning('Selection Required', 'Please select a student record to continue.');
      return;
    }

    const student = this.selectedStudent;
    const className = this.standards.find(s => s.standardId == student.standardId)?.standardName || 'N/A';

    // Build CSV rows from transaction history (or summary row if none)
    const headers = ['Trans ID', 'Payment Date', 'Student Name', 'Enrollment #', 'Class', 'Paid Amount (Rs)', 'Remaining After (Rs)'];
    
    let rows: any[][];
    if (this.previousPayments.length > 0) {
      rows = this.previousPayments.map(p => [
        p.monthlyPaymentId,
        new Date(p.paymentDate).toLocaleDateString('en-GB'),
        student.studentName,
        student.enrollmentNo || 'N/A',
        className,
        p.amountPaid,
        p.amountRemaining
      ]);
    } else {
      // Export summary row when no transactions
      rows = [[
        'N/A',
        new Date().toLocaleDateString('en-GB'),
        student.studentName,
        student.enrollmentNo || 'N/A',
        className,
        0,
        this.totalFee
      ]];
    }

    const csvContent = headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `FeeReport_${student.studentName.replace(/\s/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.previousPayments.length / this.rowsPerPage));
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedPayments = this.previousPayments.slice(start, start + this.rowsPerPage);
    this.toEntry = Math.min(start + this.rowsPerPage, this.previousPayments.length);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }


}
