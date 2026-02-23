import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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

  constructor(
    private staffSalaryService: StaffSalaryService,
    private staffService: StaffService
  ) { }

  ngOnInit(): void {
    this.loadSalaries();
    this.loadStaff();
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

  /* ================= LOAD STAFF ================= */
  loadStaff(): void {
    this.staffService.getAllStaffs().subscribe({
      next: (res) => {
        console.log('STAFF API RESPONSE:', res);
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
    this.staffSalaryService.getStaffSalaries().subscribe({
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

  /* ================= SAVE SALARY ================= */
  saveSalary(): void {

    if (!this.salary.staffName || !this.salary.basicSalary) {
      Swal.fire('Validation Error', 'Staff & Basic Salary required', 'warning');
      return;
    }

    this.salary.netSalary = this.calculatedNetSalary;

    this.staffSalaryService.addStaffSalary(this.salary).subscribe({
      next: () => {
        Swal.fire('Success', 'Salary saved successfully', 'success');
        this.resetForm();
        this.loadSalaries();
      },
      error: () => Swal.fire('Error', 'Failed to save salary', 'error')
    });
  }

  /* ================= DELETE ================= */
  deleteSalary(id: number): void {
    Swal.fire({
      title: 'Delete salary?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes'
    }).then(res => {
      if (res.isConfirmed) {
        this.staffSalaryService.deleteStaffSalary(id).subscribe(() => {
          Swal.fire('Deleted', '', 'success');
          this.loadSalaries();
        });
      }
    });
  }

  /* ================= RESET ================= */
  resetForm(): void {
    this.salary = new StaffSalary();
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
