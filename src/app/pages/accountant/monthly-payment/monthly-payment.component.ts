import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MonthlyPayment } from '../../../Models/monthly-payment';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Fee } from '../../../Models/fee';
import { AcademicMonth } from '../../../Models/academicmonth';
import { CommonServices } from '../../../services/common.service';
import { MonthlyPaymentService } from '../../../services/monthly-payment.service';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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

  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;

  selectedPayment!: MonthlyPayment;

  // Dropdown state
  showFeesDropdown = false;
  showMonthsDropdown = false;

  constructor(
    private commonService: CommonServices,
    private paymentService: MonthlyPaymentService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadAll();
    this.loadPayments();
  }

  initForm() {
    this.form = new FormGroup({
      monthlyPaymentId: new FormControl(0),
      studentId: new FormControl('', Validators.required),
      fees: new FormControl([], Validators.required),
      academicMonths: new FormControl([], Validators.required),
      waver: new FormControl(0),
      amountPaid: new FormControl(0),
      paymentDate: new FormControl('', Validators.required),
      totalAmount: new FormControl({ value: 0, disabled: true }),
      dueBalance: new FormControl({ value: 0, disabled: true })
    });

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
    this.paymentService.getAllMonthlyPayments().subscribe({
      next: r => { this.payments = r || []; this.searchPayments(); },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load payments.', confirmButtonColor: '#6366f1' })
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
      (!term || p.student?.studentName?.toLowerCase().includes(term) || p.monthlyPaymentId?.toString().includes(term))
    );
    this.currentPage = 1;
    this.updatePagination();
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
    this.form.reset({ monthlyPaymentId: 0, fees: [], academicMonths: [] });
  }

  openEditDialog(p: MonthlyPayment) {
    this.isEditMode = true;
    this.showAddEditDialog = true;
    this.form.patchValue({
      ...p,
      fees: p.fees || [],
      academicMonths: p.academicMonths || []
    });
  }

  openViewDialog(p: MonthlyPayment) {
    this.selectedPayment = p;
    this.showViewDialog = true;
  }

  savePayment() {
    if (this.form.invalid) return;

    const payload = this.form.value;
    payload.totalAmount = payload.fees.reduce((sum: any, f: any) => sum + f.amount, 0);
    payload.amountRemaining = payload.totalAmount - (payload.amountPaid || 0);

    if (this.isEditMode) {
      this.paymentService.updateMonthlyPayment(payload).subscribe({
        next: () => {
          this.closeDialog();
          this.loadPayments();
          Swal.fire({ icon: 'success', title: 'Updated!', text: 'Payment updated successfully.', showConfirmButton: false, timer: 1800 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update payment.', confirmButtonColor: '#6366f1' })
      });
    } else {
      this.paymentService.createMonthlyPayment(payload).subscribe({
        next: () => {
          this.closeDialog();
          this.loadPayments();
          Swal.fire({ icon: 'success', title: 'Created!', text: 'Payment created successfully.', showConfirmButton: false, timer: 1800 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create payment.', confirmButtonColor: '#6366f1' })
      });
    }
  }

  /* ---------- DELETE (SweetAlert2) ---------- */
  async confirmDelete(p: MonthlyPayment) {
    const result = await Swal.fire({
      title: 'Delete Payment?',
      html: `Are you sure you want to delete the payment for <strong>${p.student?.studentName}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
      this.paymentService.deleteMonthlyPayment(p.monthlyPaymentId).subscribe({
        next: () => {
          this.loadPayments();
          Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Payment deleted successfully.', showConfirmButton: false, timer: 1800 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete payment.', confirmButtonColor: '#6366f1' })
      });
    }
  }

  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.form.reset();
  }

  // ----- Multi-select dropdown helpers -----
  toggleFeesDropdown() { this.showFeesDropdown = !this.showFeesDropdown; }
  toggleMonthsDropdown() { this.showMonthsDropdown = !this.showMonthsDropdown; }

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
}
