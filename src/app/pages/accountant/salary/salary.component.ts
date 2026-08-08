import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { SalaryPaymentService } from '../../../services/salary-payment.service';
import { StaffService } from '../../../services/staff.service';
import { PayrollDeductionRuleService } from '../../../services/payroll-deduction-rule.service';

import { SalaryEntry, SalaryPayment } from '../../../Models/salary-payment';
import { Staff } from '../../../Models/staff';
import { PopupService } from '../../../services/popup.service';
import { DeductionSuggestion } from '../../../Models/payroll-deduction-rule';

const AUTO_DEDUCTION_PREFIX = 'Attendance/Leave Deduction (Auto';
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

@Component({
  selector: 'app-salary',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './salary.component.html',
  styleUrl: './salary.component.css'
})
export class SalaryComponent implements OnInit {

  title = 'Salary Management';

  /** FORM MODEL */
  salary: SalaryPayment = new SalaryPayment();

  /** TABLE DATA */
  salaries: SalaryPayment[] = [];

  /** STAFF DROPDOWN DATA */
  staffList: Staff[] = [];

  /** UI STATES */
  searchQuery = '';
  itemsPerPage = 10;
  currentPage = 1;
  loading = false;
  isProcessing = false;
  Math = Math; // For template access

  /** Last attendance/leave suggestion fetched for the current staff+month, for the formula breakdown. */
  lastSuggestion: DeductionSuggestion | null = null;
  showBreakdown = false;

  constructor(
    private salaryPaymentService: SalaryPaymentService,
    private staffService: StaffService,
    private payrollRuleService: PayrollDeductionRuleService,
    private popup: PopupService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.resetForm(); // Set defaults

    this.route.queryParams.subscribe(params => {
      const staffId = params['staffId'] ? Number(params['staffId']) : null;
      if (staffId) {
        this.salary.staffId = staffId;
        this.onStaffSelect();
      }
    });
  }

  /* ================= GETTERS FOR STATS ================= */
  get totalStaff(): number {
    return this.salaries.length;
  }

  get totalSalaryPaid(): number {
    return this.salaries.reduce((acc, s) => acc + (s.netSalary || 0), 0);
  }

  get averageSalary(): number {
    return this.totalStaff > 0 ? this.totalSalaryPaid / this.totalStaff : 0;
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  /* ================= LOAD DATA ================= */
  loadData(): void {
    this.loading = true;
    forkJoin({
      staff: this.staffService.getAllStaffs(),
      salaries: this.salaryPaymentService.getAll()
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => {
        this.staffList = res.staff || [];
        this.salaries = res.salaries || [];
      },
      error: () => this.popup.error('Load Error', 'Unable to load salary records.')
    });
  }

  loadSalaries(): void {
    this.loading = true;
    this.salaryPaymentService.getAll().pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => this.salaries = res,
      error: () => this.popup.error('Error', 'Failed to load salaries')
    });
  }

  /* ================= ADDITIONS / DEDUCTIONS ================= */
  addAddition(): void {
    this.salary.additions.push(new SalaryEntry());
  }

  removeAddition(index: number): void {
    this.salary.additions.splice(index, 1);
  }

  addDeduction(): void {
    this.salary.deductions.push(new SalaryEntry());
  }

  removeDeduction(index: number): void {
    this.salary.deductions.splice(index, 1);
  }

  private sumEntries(entries: SalaryEntry[]): number {
    return (entries || []).reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  }

  get totalAdditions(): number {
    return this.sumEntries(this.salary.additions);
  }

  get totalDeductions(): number {
    return this.sumEntries(this.salary.deductions);
  }

  /* ================= DUPLICATE DETECTION ================= */
  // Finds an already-saved record for the currently selected staff + payment month + year, so the
  // form can warn before the accountant tries to save a second salary for the same period.
  get existingRecordForSelection(): SalaryPayment | undefined {
    if (!this.salary.staffId || !this.salary.paymentMonth || !this.salary.paymentDate) return undefined;

    const year = new Date(this.salary.paymentDate).getFullYear();
    if (isNaN(year)) return undefined;

    return this.salaries.find(s =>
      s.staffId === Number(this.salary.staffId) &&
      s.paymentMonth === this.salary.paymentMonth &&
      s.paymentDate && new Date(s.paymentDate).getFullYear() === year
    );
  }

  /* ================= NET SALARY ================= */
  get calculatedNetSalary(): number {
    const basic = Number(this.salary.basicSalary) || 0;
    return basic + this.totalAdditions - this.totalDeductions;
  }

  /**
   * Net salary for a saved record from the list (already-computed totals).
   */
  getRowNetSalary(s: SalaryPayment): number {
    if (!s) return 0;
    if (s.netSalary != null) return s.netSalary;
    const basic = s.basicSalary || 0;
    return basic + (s.totalAdditions || 0) - (s.totalDeductions || 0);
  }

  onStaffSelect(): void {
    const selectedStaff = this.staffList.find(s => s.staffId === Number(this.salary.staffId));
    if (selectedStaff) {
      this.salary.staffName = selectedStaff.staffName;
      if (selectedStaff.basicSalary != null) {
        this.salary.basicSalary = selectedStaff.basicSalary;
      }
    }
    this.applyAutoDeduction();
  }

  /* ================= AUTO-SUGGESTED DEDUCTION ================= */
  // Suggests (but never forces) a deduction based on the configured Payroll Deduction Rule and the
  // staff member's attendance/leave for the pay period named by "Payment Month" (year taken from
  // Payment Date — Payment Date itself is just the disbursement date and may fall in a different
  // month, e.g. paying September's salary in early October). The suggestion is added as a normal,
  // editable deduction row — the accountant can change or remove it before saving.
  applyAutoDeduction(): void {
    if (!this.salary.staffId || !this.salary.paymentDate || !this.salary.paymentMonth) return;

    const paymentDate = new Date(this.salary.paymentDate);
    if (isNaN(paymentDate.getTime())) return;

    const monthIndex = MONTH_NAMES.indexOf(this.salary.paymentMonth);
    if (monthIndex === -1) return;
    const year = paymentDate.getFullYear();

    const startDate = new Date(year, monthIndex, 1).toISOString().split('T')[0];
    const endDate = new Date(year, monthIndex + 1, 0).toISOString().split('T')[0];

    this.payrollRuleService.calculateSuggestion(Number(this.salary.staffId), startDate, endDate).subscribe({
      next: (suggestion) => {
        this.lastSuggestion = suggestion;

        // Drop any previously auto-added row so re-triggering (staff/date change) doesn't stack duplicates.
        this.salary.deductions = this.salary.deductions.filter(d => !d.description?.startsWith(AUTO_DEDUCTION_PREFIX));

        if (suggestion.ruleActive && suggestion.suggestedDeductionAmount > 0) {
          const entry = new SalaryEntry();
          entry.description = `${AUTO_DEDUCTION_PREFIX}: ${suggestion.deductionDays} day(s))`;
          entry.amount = suggestion.suggestedDeductionAmount;
          this.salary.deductions.push(entry);
          this.popup.success(
            'Deduction Suggested',
            `Auto-suggested deduction of PKR ${suggestion.suggestedDeductionAmount} for ${suggestion.deductionDays} day(s). You can edit or remove it below before saving.`
          );
        }
      },
      error: () => {
        this.lastSuggestion = null; /* Non-blocking: salary entry still works if the rule check fails */
      }
    });
  }

  toggleBreakdown(): void {
    this.showBreakdown = !this.showBreakdown;
  }

  /* ================= SAVE SALARY ================= */
  saveSalary(): void {
    if (!this.salary.staffId || !this.salary.basicSalary || !this.salary.paymentMonth || !this.salary.paymentDate) {
      this.popup.warning('Incomplete form', 'Please fill all required fields (Staff, Month, Date, and Basic Salary).');
      return;
    }

    const existing = this.existingRecordForSelection;
    if (existing) {
      this.popup.warning(
        'Already Exists',
        `A salary record for ${this.salary.staffName} for ${this.salary.paymentMonth} ${new Date(this.salary.paymentDate).getFullYear()} ` +
        `already exists (net PKR ${(existing.netSalary || 0).toLocaleString()}). Delete or edit that record instead of saving a duplicate.`
      );
      return;
    }

    const cleanAdditions = this.salary.additions.filter(a => a.description && a.amount);
    const cleanDeductions = this.salary.deductions.filter(d => d.description && d.amount);

    const payload = {
      staffId: this.salary.staffId,
      paymentDate: this.salary.paymentDate,
      paymentMonth: this.salary.paymentMonth,
      basicSalary: this.salary.basicSalary,
      additions: cleanAdditions,
      deductions: cleanDeductions
    };

    this.isProcessing = true;
    this.popup.loading('Saving salary record...');

    this.salaryPaymentService.create(payload).subscribe({
      next: () => {
        this.isProcessing = false;
        this.popup.success('Salary Saved!', 'The salary record has been saved successfully.');
        this.resetForm();
        this.loadSalaries();
      },
      error: (err) => {
        this.isProcessing = false;
        if (err?.status === 409) {
          this.popup.warning('Already Exists', err?.error?.message || 'A salary record for this staff/month already exists.');
          this.loadSalaries();
        } else {
          this.popup.error('Processing Failed', 'An error occurred while saving the salary record.');
        }
      }
    });
  }

  /* ================= DELETE ================= */
  deleteSalary(id: number): void {
    this.popup.confirm('Delete Salary Record?', 'This action cannot be undone.').then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting salary record...');
        this.salaryPaymentService.delete(id).subscribe({
          next: () => {
            this.popup.deleted('Salary record');
            this.loadSalaries();
          },
          error: () => {
            this.popup.error('Deletion Failed', 'Could not delete the salary record. Please try again.');
          }
        });
      }
    });
  }


  /* ================= RESET ================= */
  resetForm(): void {
    const today = new Date();
    this.salary = new SalaryPayment();
    this.salary.paymentDate = today.toISOString().split('T')[0];
    this.salary.paymentMonth = today.toLocaleString('default', { month: 'long' });
    this.lastSuggestion = null;
    this.showBreakdown = false;
  }

  /* ================= FILTER + PAGINATION ================= */
  get filteredSalaries(): SalaryPayment[] {
    if (!this.searchQuery) return this.salaries;
    return this.salaries.filter(s =>
      s.staffName?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get paginatedSalaries(): SalaryPayment[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSalaries.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSalaries.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
