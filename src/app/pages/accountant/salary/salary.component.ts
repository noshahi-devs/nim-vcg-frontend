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
import { PopupService } from '../../../services/popup.service';

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
  isProcessing = false;
  Math = Math; // For template access

  constructor(
    private staffSalaryService: StaffSalaryService,
    private staffService: StaffService,
    private popup: PopupService
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
    return this.salaries.reduce((acc, s) => acc + (this.getRowNetSalary(s) || 0), 0);
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
      error: () => this.popup.error('Sync Failed', 'Unable to synchronize salary records.')
    });
  }

  loadStaff(): void {
    this.staffService.getAllStaffs().subscribe({
      next: (res) => {
        this.staffList = res;
      },
      error: (err) => {
        console.error(err);
        this.popup.error('Error', 'Failed to load staff list');
      }
    });
  }


  /* ================= LOAD SALARIES ================= */
  loadSalaries(): void {
    this.loading = true;
    this.staffSalaryService.getStaffSalaries().pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => this.salaries = res,
      error: () => this.popup.error('Error', 'Failed to load salaries')
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

  /**
   * Calculates net salary for any specific record manually.
   * This fixes the "PKR 0" or empty display issue if netSalary isn't saved/returned.
   */
  getRowNetSalary(s: StaffSalary): number {
    if (!s) return 0;
    const basic = s.basicSalary || 0;
    const bonus = s.festivalBonus || 0;
    const allowance = s.allowance || 0;
    const medical = s.medicalAllowance || 0;
    const house = s.housingAllowance || 0;
    const transport = s.transportationAllowance || 0;
    const saving = s.savingFund || 0;
    const tax = s.taxes || 0;

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
    if (!this.salary.staffId || !this.salary.basicSalary || !this.salary.paymentMonth || !this.salary.paymentDate) {
      this.popup.warning('Incomplete form', 'Please fill all required fields (Staff, Month, Date, and Basic Salary).');
      return;
    }

    this.isProcessing = true;

    this.salary.netSalary = this.calculatedNetSalary;

    this.popup.loading('Saving salary record...');

    this.staffSalaryService.addStaffSalary(this.salary).subscribe({
      next: () => {
        this.isProcessing = false;
        this.popup.success('Salary Saved!', 'The salary record has been saved successfully.');
        this.resetForm();
        this.loadSalaries();
      },
      error: () => {
        this.isProcessing = false;
        this.popup.error('Processing Failed', 'An error occurred while saving the salary record.');
      }
    });
  }

  /* ================= DELETE ================= */
  deleteSalary(id: number): void {
    this.popup.confirm('Delete Salary Record?', 'This action cannot be undone.').then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting salary record...');
        this.staffSalaryService.deleteStaffSalary(id).subscribe({
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


