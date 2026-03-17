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
      dueBalance: new FormControl({ value: 0, disabled: true })
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
    this.form.reset({
      othersPaymentId: 0,
      fees: [],
      academicMonths: [],
      waver: 0,
      amountPaid: 0,
      paymentDate: this.todayDate
    });
  }

  openEditDialog(p: OthersPayment) {
    this.isEditMode = true;
    this.showAddEditDialog = true;

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
        next: () => {
          this.isProcessing = false;
          this.closeDialog();
          this.loadPayments();
          this.showFeedback('success', 'Payment Updated', `The record for <b>${payload.studentId}</b> has been successfully revised.`);
        },
        error: () => {
          this.isProcessing = false;
          this.showFeedback('error', 'Update Failed', 'An error occurred while attempting to update the payment record.');
        }
      });
    } else {
      this.paymentService.createOthersPayment(payload).subscribe({
        next: () => {
          this.isProcessing = false;
          this.closeDialog();
          this.loadPayments();
          this.showFeedback('success', 'Payment Recorded', 'The new financial transaction has been securely logged.');
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
    this.form.reset();
  }

  // ----- Multi-select dropdown helpers -----
  toggleFeesDropdown() { this.showFeesDropdown = !this.showFeesDropdown; if (this.showFeesDropdown) this.showMonthsDropdown = false; }
  toggleMonthsDropdown() { this.showMonthsDropdown = !this.showMonthsDropdown; if (this.showMonthsDropdown) this.showFeesDropdown = false; }

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
    return fees.map((f: any) => f.feeType?.typeName).join(', ');
  }

  getSelectedMonthsNames(): string {
    const months = this.form.value.academicMonths || [];
    if (!months.length) return 'Select Months';
    return months.map((m: any) => m.monthName).join(', ');
  }

  getStandardName(standardId: any): string {
    if (!standardId) return '--';
    const std = this.standards.find(s => s.standardId == standardId);
    return std ? std.standardName : '--';
  }
}


