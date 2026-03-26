import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from '../../../swal';
import { finalize, forkJoin } from 'rxjs';

import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffSalaryService } from '../../../services/staff-salary.service';
import { StaffService } from '../../../services/staff.service';

import { StaffSalary } from '../../../Models/staff-salary';
import { Staff } from '../../../Models/staff';

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
  salary: StaffSalary = new StaffSalary();

  /** TABLE DATA */
  salaries: StaffSalary[] = [];

  /** STAFF DROPDOWN DATA */
  staffList: Staff[] = [];

  /** UI STATES */
  searchQuery = '';
  itemsPerPage = 10;
  currentPage = 1;
  loading = false;

  /** MULTI-MODAL STATES */
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  showDeleteModal = false;
  salaryToDeleteId: number | null = null;

  constructor(
    private staffSalaryService: StaffSalaryService,
    private staffService: StaffService
  ) { }

  ngOnInit(): void {
    this.loadData();
    this.resetForm(); // Set defaults
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
      salaries: this.staffSalaryService.getStaffSalaries()
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => {
        this.staffList = res.staff || [];
        this.salaries = res.salaries || [];
      },
      error: () => this.showFeedback('error', 'Sync Failed', 'Unable to synchronize salary records.')
    });
  }

  loadStaff(): void {
    this.staffService.getAllStaffs().subscribe({
      next: (res) => {
        this.staffList = res;
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to load staff list', 'error');
      }
    });
  }


  /* ================= LOAD SALARIES ================= */
  loadSalaries(): void {
    this.loading = true;
    this.staffSalaryService.getStaffSalaries().pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => this.salaries = res,
      error: () => Swal.fire('Error', 'Failed to load salaries', 'error')
    });
  }

  /* ================= NET SALARY ================= */
  get calculatedNetSalary(): number {
    const basic = this.salary.basicSalary || 0;
    const bonus = this.salary.festivalBonus || 0;
    const allowance = this.salary.allowance || 0;
    const medical = this.salary.medicalAllowance || 0;
    const house = this.salary.housingAllowance || 0;
    const transport = this.salary.transportationAllowance || 0;
    const saving = this.salary.savingFund || 0;
    const tax = this.salary.taxes || 0;

    return (
      basic +
      bonus +
      allowance +
      medical +
      house +
      transport -
      saving -
      tax
    );
  }

  onStaffSelect(): void {
    const selectedStaff = this.staffList.find(s => s.staffId === Number(this.salary.staffId));
    if (selectedStaff) {
      this.salary.staffName = selectedStaff.staffName;
    }
  }

  /* ================= SAVE SALARY ================= */
  saveSalary(): void {

    if (!this.salary.staffId || !this.salary.basicSalary) {
      this.showFeedback('warning', 'Validation Error', 'Staff & Basic Salary are required fields.');
      return;
    }

    this.salary.netSalary = this.calculatedNetSalary;

    this.isProcessing = true;

    this.staffSalaryService.addStaffSalary(this.salary).subscribe({
      next: () => {
        this.isProcessing = false;
        this.showFeedback('success', 'Salary Saved!', 'The salary record has been saved successfully.');
        this.resetForm();
        this.loadSalaries();
      },
      error: () => {
        this.isProcessing = false;
        this.showFeedback('error', 'Processing Failed', 'An error occurred while saving the salary record.');
      }
    });
  }

  /* ================= DELETE ================= */
  deleteSalary(id: number): void {
    this.salaryToDeleteId = id;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.salaryToDeleteId) return;

    this.isProcessing = true;
    this.staffSalaryService.deleteStaffSalary(this.salaryToDeleteId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.salaryToDeleteId = null;
        this.showFeedback('success', 'Deleted Successfully', 'The salary record has been permanently deleted.');
        this.loadSalaries();
      },
      error: () => {
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.salaryToDeleteId = null;
        this.showFeedback('error', 'Deletion Failed', 'Could not delete the salary record. Please try again.');
      }
    });
  }

  /* ================= FEEDBACK HELPERS ================= */
  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string): void {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  closeFeedback(): void {
    this.showFeedbackModal = false;
  }

  /* ================= RESET ================= */
  resetForm(): void {
    const today = new Date();
    this.salary = new StaffSalary();
    this.salary.paymentDate = today.toISOString().split('T')[0];
    this.salary.paymentMonth = today.toLocaleString('default', { month: 'long' });
  }

  /* ================= FILTER + PAGINATION ================= */
  get filteredSalaries(): StaffSalary[] {
    if (!this.searchQuery) return this.salaries;
    return this.salaries.filter(s =>
      s.staffName?.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  get paginatedSalaries(): StaffSalary[] {
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


