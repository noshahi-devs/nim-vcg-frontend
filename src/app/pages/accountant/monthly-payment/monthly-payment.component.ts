import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MonthlyPayment } from '../../../Models/monthly-payment';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Fee } from '../../../Models/fee';
import { AcademicMonth } from '../../../Models/academicmonth';
import { CommonServices } from '../../../services/common.service';
import { MonthlyPaymentService } from '../../../services/monthly-payment.service';
import { SettingsService } from '../../../services/settings.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import Swal from '../../../swal';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-monthly-payment',
  standalone: true,
  templateUrl: './monthly-payment.component.html',
  styleUrls: ['./monthly-payment.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent]
})
export class MonthlyPaymentComponent implements OnInit {
  title = "Monthly Payments";
  Math = Math;

  form!: FormGroup;
  payments: MonthlyPayment[] = [];
  filteredPayments: MonthlyPayment[] = [];
  paginatedPayments: MonthlyPayment[] = [];

  students: Student[] = [];
  standards: Standard[] = [];
  fees: Fee[] = [];
  academicMonths: AcademicMonth[] = [];

  searchTerm = '';
  selectedStandardId: number | null = null;

  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  loading = false;

  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;
  showPaymentDialog = false;
  paymentForm!: FormGroup;

  // Premium Modal State
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;

  // For Deletion Confirmation
  showDeleteModal = false;
  paymentToDelete: MonthlyPayment | null = null;

  selectedPayment!: MonthlyPayment;

  // School Info
  schoolInfo: any = {};

  // Dropdown & Search state
  showFeesDropdown = false;
  showMonthsDropdown = false;
  feeSearchTerm = '';
  monthSearchTerm = '';
  availableFees: Fee[] = [];

  constructor(
    private commonService: CommonServices,
    private paymentService: MonthlyPaymentService,
    private settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.initPaymentForm();
    this.loadInitialData(); // New consolidated loader
    this.loadSchoolInfo();
  }

  loadSchoolInfo() {
    this.settingsService.getSchoolInfo().subscribe(info => {
      this.schoolInfo = info;
    });
  }

  get todayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  initForm() {
    this.form = new FormGroup({
      monthlyPaymentId: new FormControl(0),
      studentId: new FormControl('', Validators.required),
      fees: new FormControl([], Validators.required),
      academicMonths: new FormControl([], Validators.required),
      waver: new FormControl(0),
      amountPaid: new FormControl(0),
      paymentDate: new FormControl(this.todayDate, Validators.required),
      totalAmount: new FormControl({ value: 0, disabled: true }),
      dueBalance: new FormControl({ value: 0, disabled: true }),
      paymentMethod: new FormControl('Cash'),
      transactionId: new FormControl(''),
      sendSms: new FormControl(true),
      printReceipt: new FormControl(true),
      totalFeeAmount: new FormControl(0) // Added to match model
    });

    // Student selection logic
    this.form.get('studentId')!.valueChanges.subscribe(sid => this.onStudentSelect(sid));

    // Recalculate amounts when relevant fields change
    this.form.get('fees')!.valueChanges.subscribe(_ => this.calculateAmounts());
    this.form.get('amountPaid')!.valueChanges.subscribe(_ => this.calculateAmounts());
    this.form.get('waver')!.valueChanges.subscribe(_ => this.calculateAmounts());
  }

  initPaymentForm() {
    this.paymentForm = new FormGroup({
      monthlyPaymentId: new FormControl(0),
      studentId: new FormControl('', Validators.required),
      amountPaid: new FormControl(0, Validators.required),
      paymentDate: new FormControl(this.todayDate, Validators.required),
      paymentMethod: new FormControl('Cash', Validators.required),
      transactionId: new FormControl(''),
      sendSms: new FormControl(true),
      printReceipt: new FormControl(true)
    });
  }

  onStudentSelect(studentId: any) {
    const student = this.students.find(s => s.studentId == studentId);
    if (student && student.standardId) {
      this.availableFees = this.fees.filter(f => f.standardId == student.standardId);
    } else {
      this.availableFees = [...this.fees];
    }
    // Clear selected fees if they are no longer available?
    // Usually better to just keep them if editing, but for new records we filter.
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
  loadInitialData() {
    this.loading = true;
    forkJoin({
      students: this.commonService.getAllStudents(),
      standards: this.commonService.getAllStandards(),
      fees: this.commonService.getAllFees(),
      months: this.commonService.getAllAcademicMonths(),
      history: this.paymentService.getAllMonthlyPayments()
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => {
        this.students = res.students || [];
        this.standards = res.standards || [];
        this.fees = res.fees || [];
        this.availableFees = [...this.fees];
        this.academicMonths = res.months || [];
        this.payments = res.history || [];
        this.applyFilters();
      },
      error: () => this.showFeedback('error', 'Sync Failed', 'Unable to synchronize payment records with the server.')
    });
  }

  loadAll() {
    this.commonService.getAllStudents().subscribe(r => this.students = r);
    this.commonService.getAllStandards().subscribe({
      next: r => this.standards = r,
      error: () => this.showFeedback('error', 'Error', 'Failed to load standards.')
    });
    this.commonService.getAllFees().subscribe(r => {
      this.fees = r;
      this.availableFees = [...this.fees];
    });
    this.commonService.getAllAcademicMonths().subscribe(r => this.academicMonths = r);
  }

  loadPaymentHistory() {
    this.loading = true;
    this.paymentService.getAllMonthlyPayments().pipe(finalize(() => this.loading = false)).subscribe({
      next: res => { this.payments = res || []; this.applyFilters(); },
      error: () => this.showFeedback('error', 'Error', 'Failed to load payment history.')
    });
  }

  /* ---------- STATS ---------- */
  get totalRecords() { return this.filteredPayments.length; }
  get totalCollected() { return this.filteredPayments.reduce((a, c) => a + (c.amountPaid || 0), 0); }
  get totalPending() { return this.filteredPayments.reduce((a, c) => a + (c.amountRemaining || 0), 0); }

  /* ---------- SEARCH & FILTER ---------- */
  applyFilters() {
    const term = this.searchTerm.toLowerCase();
    this.filteredPayments = this.payments.filter(p =>
      (!this.selectedStandardId || p.student?.standardId === this.selectedStandardId) &&
      (!term || p.student?.studentName?.toLowerCase().includes(term) || p.monthlyPaymentId?.toString().includes(term))
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  get filteredAvailableFees() {
    const term = this.feeSearchTerm.toLowerCase();
    return this.availableFees.filter(f =>
      f.feeType?.typeName?.toLowerCase().includes(term) ||
      f.amount?.toString().includes(term)
    );
  }

  get filteredAcademicMonths() {
    const term = this.monthSearchTerm.toLowerCase();
    return this.academicMonths.filter(m => m.monthName?.toLowerCase().includes(term));
  }

  /* ---------- SELECT ALL HELPERS ---------- */
  get isAllFeesSelected(): boolean {
    const selected = this.form.get('fees')?.value || [];
    return this.filteredAvailableFees.length > 0 && this.filteredAvailableFees.every(f => selected.some((s: any) => s.feeId === f.feeId));
  }

  toggleAllFees() {
    if (this.isAllFeesSelected) {
      this.form.get('fees')!.setValue([]);
    } else {
      const all = [...this.filteredAvailableFees];
      this.form.get('fees')!.setValue(all);
    }
    this.calculateAmounts();
  }

  get isAllMonthsSelected(): boolean {
    const selected = this.form.get('academicMonths')?.value || [];
    return this.filteredAcademicMonths.length > 0 && this.filteredAcademicMonths.every(m => selected.some((s: any) => s.monthId === m.monthId));
  }

  toggleAllMonths() {
    if (this.isAllMonthsSelected) {
      this.form.get('academicMonths')!.setValue([]);
    } else {
      const all = [...this.filteredAcademicMonths];
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
    this.availableFees = [...this.fees];
    this.form.reset({
      monthlyPaymentId: 0,
      fees: [],
      academicMonths: [],
      waver: 0,
      amountPaid: 0,
      totalFeeAmount: 0,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      sendSms: true,
      printReceipt: true
    });
  }

  openEditDialog(p: MonthlyPayment) {
    this.isEditMode = true;
    this.showAddEditDialog = true;

    // Ensure studentId is treated as string for the select binding if necessary
    // though [value] handles numbers fine, patchValue might need exact match.
    this.onStudentSelect(p.studentId);

    // Reconstruct selected fields from snapshots (fallback for backend One-To-Many flaw)
    let selectedFees: Fee[] = p.fees && p.fees.length > 0 ? p.fees : [];
    if (!selectedFees.length && p.paymentDetails && p.paymentDetails.length > 0) {
      const pDetailsNames = p.paymentDetails.map((pd: any) => pd.feeName?.trim().toLowerCase() || '');
      selectedFees = this.availableFees.filter(f => {
        const typeName = f.feeType?.typeName?.trim().toLowerCase() || '';
        return typeName && pDetailsNames.includes(typeName);
      });
      // Fallback to all fees if standard filter hid it
      if (!selectedFees.length) {
        selectedFees = this.fees.filter(f => {
          const typeName = f.feeType?.typeName?.trim().toLowerCase() || '';
          return typeName && pDetailsNames.includes(typeName);
        });
      }
    }

    let selectedMonths: AcademicMonth[] = p.academicMonths && p.academicMonths.length > 0 ? p.academicMonths : [];
    if (!selectedMonths.length && p.paymentMonths && p.paymentMonths.length > 0) {
      const pMonthNames = p.paymentMonths.map((pm: any) => pm.monthName?.trim().toLowerCase() || '');
      selectedMonths = this.academicMonths.filter(m => {
        const mName = m.monthName?.trim().toLowerCase() || '';
        return mName && pMonthNames.includes(mName);
      });
    }

    this.form.patchValue({
      monthlyPaymentId: p.monthlyPaymentId,
      studentId: p.studentId || '',
      fees: selectedFees,
      academicMonths: selectedMonths,
      waver: p.waver || 0,
      amountPaid: p.amountPaid || 0,
      paymentDate: p.paymentDate ? new Date(p.paymentDate).toISOString().split('T')[0] : this.todayDate,
      paymentMethod: p.paymentMethod || 'Cash',
      transactionId: p.transactionId || '',
      sendSms: p.sendSms ?? true,
      printReceipt: p.printReceipt ?? true,
      totalAmount: p.totalAmount || 0,
      dueBalance: p.amountRemaining || 0
    });

    this.calculateAmounts(); // Recalculate based on patched values
  }

  openViewDialog(p: MonthlyPayment) {
    this.selectedPayment = p;
    this.showViewDialog = true;
  }

  savePayment() {
    if (this.form.invalid) {
      this.showFeedback('warning', 'Validation Error', 'Please fill in all required fields.');
      return;
    }

    this.isProcessing = true;

    const payload = this.form.getRawValue();
    payload.totalAmount = this.form.get('totalAmount')?.value;
    payload.amountRemaining = payload.totalAmount - (payload.amountPaid || 0);
    payload.totalFeeAmount = this.form.get('totalFeeAmount')?.value;

    if (this.isEditMode) {
      this.paymentService.updateMonthlyPayment(payload).subscribe({
        next: () => {
          this.isProcessing = false;
          this.closeDialog();
          this.loadPaymentHistory(); // Changed from loadPayments
          this.showFeedback('success', 'Updated!', 'Payment updated successfully.');
        },
        error: (err) => {
          this.isProcessing = false;
          console.error('Update Error:', err);
          this.showFeedback('error', 'Error', 'Failed to update payment. ' + (err.error?.title || err.message || ''));
        }
      });
    } else {
      this.paymentService.createMonthlyPayment(payload).subscribe({
        next: () => {
          this.isProcessing = false;
          this.closeDialog();
          this.loadPaymentHistory(); // Changed from loadPayments
          this.showFeedback('success', 'Created!', 'Payment created successfully.');
        },
        error: (err) => {
          this.isProcessing = false;
          console.error('Create Error:', err);
          this.showFeedback('error', 'Error', 'Failed to create payment. ' + (err.error?.title || err.message || ''));
        }
      });
    }
  }

  /* ---------- DELETE (SweetAlert2) ---------- */
  confirmDelete(p: MonthlyPayment) {
    this.paymentToDelete = p;
    this.showDeleteModal = true;
  }

  deletePayment() {
    if (!this.paymentToDelete) return;

    this.isProcessing = true;
    this.paymentService.deleteMonthlyPayment(this.paymentToDelete.monthlyPaymentId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.paymentToDelete = null;
        this.loadPaymentHistory(); // Changed from loadPayments
        this.showFeedback('success', 'Deleted!', 'Payment deleted successfully.');
      },
      error: (err) => {
        this.isProcessing = false;
        this.showDeleteModal = false;
        console.error('Delete Error:', err);
        this.showFeedback('error', 'Error', 'Failed to delete payment. ' + (err.error?.title || err.message || ''));
      }
    });
  }

  collectPayment() {
    if (this.paymentForm.invalid) {
      this.showFeedback('warning', 'Validation Error', 'Please fill in all required fields for payment collection.');
      return;
    }
    const payload = this.paymentForm.value;

    this.isProcessing = true;

    this.paymentService.createMonthlyPayment(payload).subscribe({
      next: () => {
        this.isProcessing = false;
        this.showPaymentDialog = false;
        this.loadPaymentHistory();
        this.showFeedback('success', 'Success!', 'Payment has been collected successfully.');
      },
      error: (err) => {
        this.isProcessing = false;
        const msg = err.error?.message || 'Failed to collect payment.';
        this.showFeedback('error', 'Error', msg);
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
    this.showDeleteModal = false; // Close delete modal
    this.showPaymentDialog = false; // Close payment dialog
    this.feeSearchTerm = '';
    this.monthSearchTerm = '';
    this.form.reset();
  }

  printReceipt(payment: MonthlyPayment) {
    this.selectedPayment = payment;
    setTimeout(() => {
      window.print();
    }, 100);
  }

  // ----- Multi-select dropdown helpers -----
  toggleFeesDropdown() { this.showFeesDropdown = !this.showFeesDropdown; if (this.showFeesDropdown) this.showMonthsDropdown = false; }
  toggleMonthsDropdown() { this.showMonthsDropdown = !this.showMonthsDropdown; if (this.showMonthsDropdown) this.showFeesDropdown = false; }

  isFeeSelected(fee: Fee) {
    return (this.form.value.fees || []).some((f: any) => f.feeId === fee.feeId);
  }
  toggleFee(fee: Fee, event: any) {
    let fees = [...(this.form.value.fees || [])];
    if (event.target.checked) fees.push(fee);
    else fees = fees.filter((f: any) => f.feeId !== fee.feeId);
    this.form.get('fees')!.setValue(fees);
    this.calculateAmounts();
  }

  isMonthSelected(month: AcademicMonth) {
    return (this.form.value.academicMonths || []).some((m: any) => m.monthId === month.monthId);
  }
  toggleMonth(month: AcademicMonth, event: any) {
    let months = [...(this.form.value.academicMonths || [])];
    if (event.target.checked) months.push(month);
    else months = months.filter((m: any) => m.monthId !== month.monthId);
    this.form.get('academicMonths')!.setValue(months);
    this.calculateAmounts();
  }

  // ----- Display helper functions -----
  getFeeString(fees: { feeId: number; amount: number; feeType?: any }[]): string {
    if (!fees || fees.length === 0) return '';
    return fees.map(f => `${f.feeType?.typeName} - ${f.amount}`).join(', ');
  }

  getMonthString(months: AcademicMonth[]): string {
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


