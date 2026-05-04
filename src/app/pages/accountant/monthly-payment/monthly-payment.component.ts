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
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

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
  isProcessing = false;
  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;
  showPaymentDialog = false;
  paymentForm!: FormGroup;

  selectedPayment!: MonthlyPayment;

  // School Info
  schoolInfo: any = {};

  // Dropdown & Search state
  selectedClassId: number | null = null;
  showStudentDropdown = false;
  studentSearchTerm = '';
  showFeesDropdown = false;
  showMonthsDropdown = false;
  feeSearchTerm = '';
  monthSearchTerm = '';
  availableFees: Fee[] = [];

  constructor(
    private commonService: CommonServices,
    private paymentService: MonthlyPaymentService,
    private settingsService: SettingsService,
    private route: ActivatedRoute,
    private popup: PopupService
  ) { }

  autoAddClassId: any = null;
  autoAddStudentId: any = null;
  autoAddTriggered = false;

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'add') {
        this.autoAddClassId = params['classId'];
        this.autoAddStudentId = params['studentId'];
      }
    });
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
      previousDue: new FormControl({ value: 0, disabled: true }),
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
    if (student) {
      // 1. Filter and Map for Monthly Fees (Respect Student-Specific Overrides)
      const baseFees = this.fees.filter(f => 
        (f.standardId == student.standardId || !f.standardId) && 
        ((f.paymentFrequency as any) == 0 || (f.paymentFrequency as any) == 'Monthly' || !f.paymentFrequency)
      );

      this.availableFees = baseFees.map(f => {
        const studentOverride = student.studentFees?.find(sf => sf.feeId === f.feeId);
        if (studentOverride) {
          return { ...f, amount: studentOverride.assignedAmount, isCustom: true };
        }
        return f;
      });

      // 2. Auto-fill Discount
      if (!this.isEditMode) {
        this.form.get('waver')!.setValue(student.defaultDiscount || 0);
      }

      // 3. Calculate Previous Dues (Sum of amountRemaining from past records)
      const prevDues = this.payments
        .filter(p => p.studentId == studentId && p.monthlyPaymentId !== this.form.get('monthlyPaymentId')?.value)
        .reduce((sum, p) => sum + (p.amountRemaining || 0), 0);
      
      this.form.patchValue({ previousDue: prevDues }, { emitEvent: false });
    } else {
      this.availableFees = [];
      this.form.patchValue({ previousDue: 0 }, { emitEvent: false });
    }
    this.calculateAmounts();
  }

  calculateAmounts() {
    const fees = this.form.get('fees')!.value || [];
    const waverPercent = this.form.get('waver')!.value || 0;
    const amountPaid = this.form.get('amountPaid')!.value || 0;
    const prevDue = this.form.get('previousDue')?.value || 0;

    // Gross Total for selected fees
    const grossTotal = fees.reduce((sum: any, f: any) => sum + (f.amount || 0), 0);
    
    // Discount amount
    const discountAmt = (grossTotal * waverPercent / 100);
    
    // Total for this month
    const netCurrent = grossTotal - discountAmt;
    
    // Total payable (Current Net + Arrears)
    const totalPayable = netCurrent + prevDue;
    
    // Final balance after this payment
    const due = totalPayable - amountPaid;

    this.form.patchValue({
      totalFeeAmount: grossTotal,
      totalAmount: totalPayable,
      dueBalance: due
    }, { emitEvent: false });
  }

// ----- Helper Methods -----
  checkAutoAdd() {
    if (this.autoAddClassId && this.autoAddStudentId && !this.autoAddTriggered) {
      this.autoAddTriggered = true;
      this.openAddDialog();
      this.selectedClassId = Number(this.autoAddClassId);
      this.form.patchValue({ studentId: Number(this.autoAddStudentId) });
    }
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
        this.checkAutoAdd();
      },
      error: () => this.popup.error('Sync Failed', 'Unable to synchronize payment records with the server.')
    });
  }

  loadAll() {
    this.commonService.getAllStudents().subscribe(r => this.students = r);
    this.commonService.getAllStandards().subscribe({
      next: r => this.standards = r,
      error: () => this.popup.error('Error', 'Failed to load standards.')
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
      error: () => this.popup.error('Error', 'Failed to load payment history.')
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
    this.availableFees = [];
    this.selectedClassId = null;
    this.showStudentDropdown = false;
    this.studentSearchTerm = '';
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
    this.selectedClassId = p.student?.standardId || null;
    this.showStudentDropdown = false;
    this.studentSearchTerm = '';

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
      this.popup.warning('Please fill in all required fields.', 'Validation Error');
      return;
    }

    this.popup.loading(this.isEditMode ? 'Updating payment...' : 'Recording payment...');

    const payload = this.form.getRawValue();
    payload.totalAmount = this.form.get('totalAmount')?.value;
    payload.amountRemaining = payload.totalAmount - (payload.amountPaid || 0);
    payload.totalFeeAmount = this.form.get('totalFeeAmount')?.value;

    if (this.isEditMode) {
      this.paymentService.updateMonthlyPayment(payload).subscribe({
        next: (res) => {
          this.closeDialog();
          this.loadPaymentHistory();
          this.popup.success('Updated!', 'Payment updated successfully.');
          this.checkAndAutoPrint(payload, res);
        },
        error: (err) => {
          this.popup.error('Error', 'Failed to update payment. ' + (err.error?.title || err.message || ''));
        }
      });
    } else {
      this.paymentService.createMonthlyPayment(payload).subscribe({
        next: (res) => {
          this.closeDialog();
          this.loadPaymentHistory();
          this.popup.success('Created!', 'Payment created successfully.');
          this.checkAndAutoPrint(payload, res);
        },
        error: (err) => {
          this.popup.error('Error', 'Failed to create payment. ' + (err.error?.title || err.message || ''));
        }
      });
    }
  }

  private checkAndAutoPrint(payload: any, APIresponse: any) {
    if (payload.printReceipt) {
      // Find the student to populate the nested name correctly
      const fullStudent = this.students.find(s => s.studentId == payload.studentId);
      
      const receiptData: any = {
        ...payload,
        monthlyPaymentId: APIresponse?.monthlyPaymentId || payload.monthlyPaymentId || Date.now(),
        student: fullStudent
      };

      // Slight delay to allow modal closures to complete
      setTimeout(() => {
        this.printReceipt(receiptData);
      }, 500);
    }
  }

  /* ---------- DELETE (SweetAlert2) ---------- */
  confirmDelete(p: MonthlyPayment) {
    this.popup.confirm(
      'Delete Payment?',
      `Are you sure you want to delete the payment record for <strong>${p.student?.studentName}</strong>?`,
      'Yes, Delete',
      'Cancel'
    ).then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting payment...');
        this.paymentService.deleteMonthlyPayment(p.monthlyPaymentId).subscribe({
          next: () => {
            this.loadPaymentHistory();
            this.popup.deleted('Payment record');
          },
          error: (err) => {
            console.error('Delete Error:', err);
            this.popup.deleteError('Payment record', 'Failed to delete the record. ' + (err.error?.title || err.message || ''));
          }
        });
      }
    });
  }

  deletePayment() {
    // legacy - unused
  }

  collectPayment() {
    if (this.paymentForm.invalid) {
      this.popup.warning('Please fill in all required fields.', 'Validation Error');
      return;
    }
    const payload = this.paymentForm.value;

    this.popup.loading('Collecting payment...');

    this.paymentService.createMonthlyPayment(payload).subscribe({
      next: () => {
        this.showPaymentDialog = false;
        this.loadPaymentHistory();
        this.popup.success('Success!', 'Payment has been collected successfully.');
      },
      error: (err) => {
        const msg = err.error?.message || 'Failed to collect payment.';
        this.popup.error('Error', msg);
      }
    });
  }

  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.showPaymentDialog = false; // Close payment dialog
    this.feeSearchTerm = '';
    this.monthSearchTerm = '';
    this.selectedClassId = null;
    this.showStudentDropdown = false;
    this.studentSearchTerm = '';
    this.form.reset();
  }

  printReceipt(payment: any) {
    const schoolName = this.schoolInfo?.schoolName || 'Vision College';
    const today = new Date(payment.paymentDate || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const className = payment.student?.standard?.standardName || this.getStandardName(payment.student?.standardId);

    // Calculate details for the table
    const baseTotal = payment.totalFeeAmount || payment.totalAmount;
    const discountAmt = (baseTotal * (payment.waver || 0)) / 100;
    
    // Rows
    let rowsHtml = '';
    if (payment.fees?.length) {
      rowsHtml += `<tr><td>Fees: ${this.getFeeString(payment.fees)}</td><td class="text-right">${baseTotal.toLocaleString()}</td></tr>`;
    }
    if (payment.academicMonths?.length) {
      rowsHtml += `<tr><td>Months: ${this.getMonthString(payment.academicMonths)}</td><td class="text-right">-</td></tr>`;
    }
    rowsHtml += `<tr><td>&nbsp;</td><td>&nbsp;</td></tr>`;

    // Footer
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
          <div class="v-row"><strong>Receipt #:</strong> <span style="color:var(--primary-color); font-weight:bold;">${payment.monthlyPaymentId ? String(payment.monthlyPaymentId).padStart(5, '0') : 'NEW'}</span></div>
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
    display: flex; align-items: center; border-bottom: 2.5px solid var(--primary-color);
    padding-bottom: 8px; margin-bottom: 10px; gap: 10px;
  }
  .v-logo { height: 38px; width: auto; }
  .v-school-info h2 { color: var(--primary-color); font-size: 15px; font-weight: 800; margin: 0; }
  .v-campus { font-size: 10px; font-weight: 700; color: var(--primary-color); letter-spacing: 1px; margin: 1px 0 0 !important; }
  .v-title-bar {
    display: flex; justify-content: space-between; align-items: center;
    background: #f1f5f9; padding: 5px 10px; font-weight: bold;
    margin-bottom: 10px; border-radius: 4px; font-size: 11px;
  }
  .v-copy-tag { text-transform: uppercase; letter-spacing: 0.5px; color: var(--primary-color); }
  .v-date { font-weight: 600; color: #475569; }
  .v-student-panel { margin-bottom: 12px; }
  .v-row { padding: 3px 0; font-size: 12px; }
  .v-row strong { display: inline-block; width: 75px; color: #475569; }
  .v-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  .v-table th, .v-table td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 11px; }
  .v-table th { background: #f8fafc; text-align: left; font-weight: 700; color: #1e293b; }
  .text-right { text-align: right !important; }
  .v-table tfoot td { background: #fef2f2; font-size: 12px; border-top: 2px solid var(--primary-color); }
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

  // ----- Student Custom Dropdown Helpers -----
  onClassChange() {
    this.form.patchValue({ studentId: '' });
    this.studentSearchTerm = '';
    this.showStudentDropdown = false;
    this.availableFees = [];
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
    if (this.availableFees.length > 0 && fees.length === this.availableFees.length) return 'All Fees Selected';
    if (fees.length > 2) return `${fees.length} Fees Selected`;
    return fees.map((f: any) => f.feeType?.typeName).join(', ');
  }

  getSelectedMonthsNames(): string {
    const months = this.form.value.academicMonths || [];
    if (!months.length) return 'Select Months';
    if (this.academicMonths.length > 0 && months.length === this.academicMonths.length) return 'All Months Selected';
    if (months.length > 2) return `${months.length} Months Selected`;
    return months.map((m: any) => m.monthName).join(', ');
  }

  getStandardName(standardId: any): string {
    if (!standardId) return '--';
    const std = this.standards.find(s => s.standardId == standardId);
    return std ? std.standardName : '--';
  }
}


