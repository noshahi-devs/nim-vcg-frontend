import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Fee } from '../../../Models/fee';
import { AcademicMonth } from '../../../Models/academicmonth';
import { CommonServices } from '../../../services/common.service';
import { OtherPaymentService } from '../../../services/other-payment.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OthersPayment } from '../../../Models/other-payment';
import Swal from '../../../swal';

@Component({
  selector: 'app-other-payment',
  standalone: true,
  templateUrl: './other-payment.component.html',
  styleUrls: ['./other-payment.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent]
})
export class OtherPaymentComponent implements OnInit {
  title = "Other Payments";
  Math = Math;

  form!: FormGroup;
  payments: OthersPayment[] = [];
  filteredPayments: OthersPayment[] = [];
  paginatedPayments: OthersPayment[] = [];

  students: Student[] = [];
  standards: Standard[] = [];
  fees: Fee[] = [];
  academicMonths: AcademicMonth[] = [];

  searchTerm = '';
  selectedStandardId: number | null = null;

  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;

  showAddEditDialog = false;
  showViewDialog = false;
  selectedPayment!: OthersPayment;
  paymentToDelete: OthersPayment | null = null;

  // Premium Modal States
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;
  showDeleteModal = false;
  isEditMode = false;

  // Dropdown & Search state
  selectedClassId: number | null = null;
  showStudentDropdown = false;
  studentSearchTerm = '';
  showFeesDropdown = false;
  showMonthsDropdown = false;
  feeSearchTerm = '';
  monthSearchTerm = '';

  constructor(
    private commonService: CommonServices,
    private paymentService: OtherPaymentService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadAll();
    this.loadPayments();
  }

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  initForm() {
    this.form = new FormGroup({
      othersPaymentId: new FormControl(0),
      studentId: new FormControl('', Validators.required),
      fees: new FormControl([], Validators.required),
      academicMonths: new FormControl([], Validators.required),
      waver: new FormControl(0),
      amountPaid: new FormControl(0),
      paymentDate: new FormControl(this.todayDate, Validators.required),
      totalAmount: new FormControl({ value: 0, disabled: true }),
      dueBalance: new FormControl({ value: 0, disabled: true }),
      printReceipt: new FormControl(true)
    });

    // Recalculate amounts when relevant fields change
    this.form.get('fees')!.valueChanges.subscribe(_ => this.calculateAmounts());
    this.form.get('amountPaid')!.valueChanges.subscribe(_ => this.calculateAmounts());
    this.form.get('waver')!.valueChanges.subscribe(_ => this.calculateAmounts());
  }

  calculateAmounts() {
    const fees = this.form.get('fees')!.value || [];
    const waver = this.form.get('waver')!.value || 0;
    const amountPaid = this.form.get('amountPaid')!.value || 0;

    const total = fees.reduce((sum: any, f: any) => sum + (f.amount || 0), 0);
    const discountedTotal = total - (total * waver / 100);
    const due = discountedTotal - amountPaid;

    this.form.get('totalAmount')!.setValue(discountedTotal, { emitEvent: false });
    this.form.get('dueBalance')!.setValue(due, { emitEvent: false });
  }

  /* ---------- LOADERS ---------- */
  loadAll() {
    this.commonService.getAllStudents().subscribe(r => this.students = r);
    this.commonService.getAllStandards().subscribe(r => this.standards = r);
    this.commonService.getAllFees().subscribe(r => this.fees = r);
    this.commonService.getAllAcademicMonths().subscribe(r => this.academicMonths = r);
  }

  loadPayments() {
    this.isProcessing = true;
    this.paymentService.getOtherPayments().subscribe({
      next: r => {
        this.payments = r || [];
        this.isProcessing = false;
        this.searchPayments();
      },
      error: () => {
        this.isProcessing = false;
        this.showFeedback('error', 'Critical Error', 'Encountered an issue while retrieving payment records. Please try again.');
      }
    });
  }

  /* ---------- STATS ---------- */
  get totalRecords() { return this.payments.length; }
  get totalCollected() { return this.payments.reduce((a, c) => a + (c.amountPaid || 0), 0); }
  get totalPending() { return this.payments.reduce((a, c) => a + (c.amountRemaining || 0), 0); }

  /* ---------- SEARCH & FILTER ---------- */
  searchPayments() {
    const term = this.searchTerm.toLowerCase();
    this.filteredPayments = this.payments.filter(p =>
      (!this.selectedStandardId || p.student?.standardId === this.selectedStandardId) &&
      (!term || p.student?.studentName?.toLowerCase().includes(term) || p.othersPaymentId?.toString().includes(term))
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  get filteredFees() {
    const term = this.feeSearchTerm.toLowerCase();
    return this.fees.filter(f =>
      f.feeType?.typeName?.toLowerCase().includes(term) ||
      f.amount?.toString().includes(term)
    );
  }

  get filteredMonths() {
    const term = this.monthSearchTerm.toLowerCase();
    return this.academicMonths.filter(m => m.monthName?.toLowerCase().includes(term));
  }

  /* ---------- SELECT ALL HELPERS ---------- */
  get isAllFeesSelected(): boolean {
    const selected = this.form.get('fees')?.value || [];
    return this.filteredFees.length > 0 && this.filteredFees.every(f => selected.some((s: any) => s.feeId === f.feeId));
  }

  toggleAllFees() {
    if (this.isAllFeesSelected) {
      this.form.get('fees')!.setValue([]);
    } else {
      const all = [...this.filteredFees];
      this.form.get('fees')!.setValue(all);
    }
    this.calculateAmounts();
  }

  get isAllMonthsSelected(): boolean {
    const selected = this.form.get('academicMonths')?.value || [];
    return this.filteredMonths.length > 0 && this.filteredMonths.every(m => selected.some((s: any) => s.monthId === m.monthId));
  }

  toggleAllMonths() {
    if (this.isAllMonthsSelected) {
      this.form.get('academicMonths')!.setValue([]);
    } else {
      const all = [...this.filteredMonths];
      this.form.get('academicMonths')!.setValue(all);
    }
  }

  /* ---------- PAGINATION ---------- */
  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredPayments.length / this.rowsPerPage));
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedPayments = this.filteredPayments.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  get toEntry() {
    return this.filteredPayments.length === 0 ? 0 : Math.min(this.currentPage * this.rowsPerPage, this.filteredPayments.length);
  }

  /* ---------- ADD / EDIT ---------- */
  openAddDialog() {
    this.isEditMode = false;
    this.showAddEditDialog = true;
    this.selectedClassId = null;
    this.showStudentDropdown = false;
    this.studentSearchTerm = '';
    this.form.reset({
      othersPaymentId: 0,
      fees: [],
      academicMonths: [],
      waver: 0,
      amountPaid: 0,
      paymentDate: this.todayDate,
      printReceipt: true
    });
  }

  openEditDialog(p: OthersPayment) {
    this.isEditMode = true;
    this.showAddEditDialog = true;
    this.selectedClassId = p.student?.standardId || null;
    this.showStudentDropdown = false;
    this.studentSearchTerm = '';

    // Fallback reconstruction if backend relationship has One-To-Many flaw
    let selectedFees: Fee[] = p.fees && p.fees.length > 0 ? p.fees as any : [];
    if (!selectedFees.length && p.otherPaymentDetails && p.otherPaymentDetails.length > 0) {
      const detailNames = p.otherPaymentDetails.map(d => d.feeName?.trim().toLowerCase());
      selectedFees = this.fees.filter(f => detailNames.includes(f.feeType?.typeName?.trim().toLowerCase()));
    }

    let selectedMonths: AcademicMonth[] = p.academicMonths && p.academicMonths.length > 0 ? p.academicMonths : [];
    if (!selectedMonths.length && p.otherPaymentDetails?.length) {
      // For months, we might not have them in OtherPaymentDetail names, 
      // but let's check if the backend actually returned them now with our fix.
    }

    this.form.patchValue({
      ...p,
      fees: selectedFees,
      academicMonths: selectedMonths,
      waver: p.waver || 0,
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : ''
    });
    this.calculateAmounts();
  }

  openViewDialog(p: OthersPayment) {
    this.selectedPayment = p;
    this.showViewDialog = true;
  }

  savePayment() {
    if (this.form.invalid || this.isProcessing) return;

    this.isProcessing = true;
    const payload = this.form.getRawValue();
    payload.totalAmount = this.form.get('totalAmount')?.value;
    payload.amountRemaining = payload.totalAmount - (payload.amountPaid || 0);

    if (this.isEditMode) {
      this.paymentService.updateOthersPayment(payload).subscribe({
        next: (res: any) => {
          this.isProcessing = false;
          this.closeDialog();
          this.loadPayments();
          this.showFeedback('success', 'Payment Updated', `The record has been successfully revised.`);
          this.checkAndAutoPrint(payload, res);
        },
        error: () => {
          this.isProcessing = false;
          this.showFeedback('error', 'Update Failed', 'An error occurred while attempting to update the payment record.');
        }
      });
    } else {
      this.paymentService.createOthersPayment(payload).subscribe({
        next: (res: any) => {
          this.isProcessing = false;
          this.closeDialog();
          this.loadPayments();
          this.showFeedback('success', 'Payment Recorded', 'The new financial transaction has been securely logged.');
          this.checkAndAutoPrint(payload, res);
        },
        error: () => {
          this.isProcessing = false;
          this.showFeedback('error', 'Submission Failed', 'Failed to log the new payment. Please verify the details and retry.');
        }
      });
    }
  }

  /* ---------- DELETE (SweetAlert2) ---------- */
  confirmDelete(p: OthersPayment) {
    this.paymentToDelete = p;
    this.showDeleteModal = true;
  }

  deletePayment() {
    if (!this.paymentToDelete || this.isProcessing) return;

    this.isProcessing = true;
    this.paymentService.deleteOthersPayment(this.paymentToDelete.othersPaymentId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.loadPayments();
        this.showFeedback('success', 'Deletion Complete', 'The payment record has been permanently removed from the system.');
      },
      error: () => {
        this.isProcessing = false;
        this.showFeedback('error', 'Cleanup Failed', 'A system error prevented the deletion of this record.');
      }
    });
  }

  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  closeFeedback() {
    this.showFeedbackModal = false;
  }

  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.feeSearchTerm = '';
    this.monthSearchTerm = '';
    this.selectedClassId = null;
    this.showStudentDropdown = false;
    this.studentSearchTerm = '';
    this.form.reset();
  }

  // ----- Student Custom Dropdown Helpers -----
  onClassChange() {
    this.form.patchValue({ studentId: '' });
    this.studentSearchTerm = '';
    this.showStudentDropdown = false;
  }

  toggleStudentDropdown() {
    this.showStudentDropdown = !this.showStudentDropdown;
    if (this.showStudentDropdown) {
      this.showFeesDropdown = false;
      this.showMonthsDropdown = false;
    }
  }

  get filteredClassStudents() {
    let list = this.students;
    if (this.selectedClassId) {
      list = list.filter(s => s.standardId == this.selectedClassId);
    }
    if (this.studentSearchTerm) {
      const term = this.studentSearchTerm.toLowerCase();
      list = list.filter(s => 
        (s.studentName || '').toLowerCase().includes(term) || 
        String(s.enrollmentNo || '').toLowerCase().includes(term)
      );
    }
    return list;
  }

  getSelectedStudentName(): string {
    const sId = this.form.get('studentId')?.value;
    if (!sId) return 'Choose a student...';
    const s = this.students.find(x => x.studentId == sId);
    return s ? `${s.studentName} ${s.enrollmentNo ? '(' + s.enrollmentNo + ')' : ''}` : 'Choose a student...';
  }

  selectStudent(studentId: number) {
    this.form.patchValue({ studentId });
    this.showStudentDropdown = false;
    this.studentSearchTerm = '';
  }

  // ----- Multi-select dropdown helpers -----
  toggleFeesDropdown() { this.showFeesDropdown = !this.showFeesDropdown; if (this.showFeesDropdown) { this.showMonthsDropdown = false; this.showStudentDropdown = false; } }
  toggleMonthsDropdown() { this.showMonthsDropdown = !this.showMonthsDropdown; if (this.showMonthsDropdown) { this.showFeesDropdown = false; this.showStudentDropdown = false; } }

  isFeeSelected(fee: Fee) {
    return (this.form.value.fees || []).some((f: any) => f.feeId === fee.feeId);
  }
  toggleFee(fee: Fee, event: any) {
    let fees = [...(this.form.value.fees || [])];
    if (event.target.checked) fees.push({ feeId: fee.feeId, amount: fee.amount, feeType: fee.feeType });
    else fees = fees.filter((f: any) => f.feeId !== fee.feeId);
    this.form.get('fees')!.setValue(fees);
    this.calculateAmounts();
  }

  isMonthSelected(month: AcademicMonth) {
    return (this.form.value.academicMonths || []).some((m: any) => m.monthId === month.monthId);
  }
  toggleMonth(month: AcademicMonth, event: any) {
    let months = [...(this.form.value.academicMonths || [])];
    if (event.target.checked) months.push({ monthId: month.monthId, monthName: month.monthName });
    else months = months.filter((m: any) => m.monthId !== month.monthId);
    this.form.get('academicMonths')!.setValue(months);
  }

  // ----- Display helper functions -----
  getFeeString(fees: { feeId: number; amount: number; feeType?: any }[]): string {
    if (!fees || fees.length === 0) return '';
    return fees.map(f => `${f.feeType?.typeName} - ${f.amount}`).join(', ');
  }

  getMonthString(months: { monthId: number; monthName?: string }[]): string {
    if (!months || months.length === 0) return '';
    return months.map(m => m.monthName).join(', ');
  }

  getSelectedFeesNames(): string {
    const fees = this.form.value.fees || [];
    if (!fees.length) return 'Select Fees';
    if (this.filteredFees.length > 0 && fees.length === this.filteredFees.length) return 'All Fees Selected';
    if (fees.length > 2) return `${fees.length} Fees Selected`;
    return fees.map((f: any) => f.feeType?.typeName).join(', ');
  }

  getSelectedMonthsNames(): string {
    const months = this.form.value.academicMonths || [];
    if (!months.length) return 'Select Months';
    if (this.filteredMonths.length > 0 && months.length === this.filteredMonths.length) return 'All Months Selected';
    if (months.length > 2) return `${months.length} Months Selected`;
    return months.map((m: any) => m.monthName).join(', ');
  }

  getStandardName(standardId: any): string {
    if (!standardId) return '--';
    const std = this.standards.find(s => s.standardId == standardId);
    return std ? std.standardName : '--';
  }

  // ----- PRINTING HELPERS -----
  private checkAndAutoPrint(payload: any, APIresponse: any) {
    if (payload.printReceipt) {
      const fullStudent = this.students.find(s => s.studentId == payload.studentId);
      const receiptData: any = {
        ...payload,
        othersPaymentId: APIresponse?.othersPaymentId || payload.othersPaymentId || Date.now(),
        student: fullStudent
      };
      setTimeout(() => this.printReceipt(receiptData), 500);
    }
  }

  printReceipt(payment: any) {
    const schoolName = 'Vision College';
    const today = new Date(payment.paymentDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const className = payment.student?.standard?.standardName || this.getStandardName(payment.student?.standardId);

    const baseTotal = payment.totalFeeAmount || payment.totalAmount || 0;
    const discountAmt = (baseTotal * (payment.waver || 0)) / 100;
    
    let rowsHtml = '';
    if (payment.fees?.length) {
      rowsHtml += `<tr><td>Fees: ${this.getFeeString(payment.fees)}</td><td class="text-right">${baseTotal.toLocaleString()}</td></tr>`;
    }
    if (payment.academicMonths?.length) {
      rowsHtml += `<tr><td>Months: ${this.getMonthString(payment.academicMonths)}</td><td class="text-right">-</td></tr>`;
    }
    rowsHtml += `<tr><td>&nbsp;</td><td>&nbsp;</td></tr>`;

    let tfootHtml = '';
    if (payment.waver > 0) {
      tfootHtml += `<tr><td class="text-right"><strong>Subtotal:</strong></td><td class="text-right">Rs. ${baseTotal.toLocaleString()}</td></tr>`;
      tfootHtml += `<tr><td class="text-right"><strong>Discount (${payment.waver}%):</strong></td><td class="text-right">- Rs. ${discountAmt.toLocaleString()}</td></tr>`;
    }
    tfootHtml += `<tr><td class="text-right"><strong>Amount Paid:</strong></td><td class="text-right"><strong>Rs. ${(payment.amountPaid || 0).toLocaleString()}</strong></td></tr>`;
    if (payment.amountRemaining > 0) {
      tfootHtml += `<tr><td class="text-right" style="color:#d32f2f;"><strong>Remaining Dues:</strong></td><td class="text-right" style="color:#d32f2f;"><strong>Rs. ${(payment.amountRemaining || 0).toLocaleString()}</strong></td></tr>`;
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
          <div class="v-row"><strong>Receipt #:</strong> <span style="color:#800000; font-weight:bold;">O-${payment.othersPaymentId ? String(payment.othersPaymentId).padStart(5, '0') : 'NEW'}</span></div>
          <div class="v-row"><strong>Name:</strong> <span>${payment.student?.studentName || '-'}</span></div>
          <div class="v-row"><strong>Class:</strong> <span>${className}</span></div>
          <div class="v-row"><strong>Enrollment:</strong> <span>${payment.student?.enrollmentNo || '-'}</span></div>
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
<html><head><title>Other Payment Receipt</title>
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
}


