import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffSalaryService } from '../../../services/staff-salary.service';
import { StaffService } from '../../../services/staff.service';
import { StaffSalary } from '../../../Models/staff-salary';
import { Staff } from '../../../Models/staff';

interface SalaryRecord {
  id: number;
  staffId: string;
  staffName: string;
  role: string;
  month: string;
  date: string;
  basicSalary: number;
  festivalBonus: number;
  allowance: number;
  medicalAllowance: number;
  housingAllowance: number;
  transportationAllowance: number;
  savingFund: number;
  taxes: number;
  netSalary: number;
  status: string;
}

@Component({
  selector: 'app-salary-slip',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './salary-slip.component.html',
  styleUrl: './salary-slip.component.css'
})
export class SalarySlipComponent implements OnInit {
  title = 'Salary Paid Slips';

  // Search
  searchQuery: string = '';
  selectedMonth: string = '';

  // Staff List for dropdown
  staffList: Staff[] = [];
  filteredStaffList: Staff[] = [];
  showDropdown: boolean = false;

  // Form Fields
  staffId: string = '';
  staffName: string = '';
  staffRole: string = '';
  salaryMonth: string = '';
  salaryDate: string = '';
  basicSalary: number = 0;
  festivalBonus: number = 0;
  allowance: number = 0;
  medicalAllowance: number = 0;
  housingAllowance: number = 0;
  transportationAllowance: number = 0;
  savingFund: number = 0;
  taxes: number = 0;

  // Salary Records
  salaryRecords: SalaryRecord[] = [];
  allSalaryData: StaffSalary[] = [];

  // Pagination
  itemsPerPage: number = 9;
  currentPage: number = 1;

  // Selected slip for printing
  selectedSlip: SalaryRecord | null = null;

  // Loading state
  isLoading: boolean = false;

  constructor(
    private staffSalaryService: StaffSalaryService,
    private staffService: StaffService
  ) { }

  ngOnInit(): void {
    this.setCurrentMonth();
    this.loadStaffList();
    this.loadSalaryRecords();
  }

  setCurrentMonth(): void {
    const today = new Date();
    this.selectedMonth = today.toISOString().substring(0, 7);
    this.salaryMonth = today.toISOString().substring(0, 7);
    this.salaryDate = today.toISOString().split('T')[0];
  }

  loadStaffList(): void {
    this.staffService.getAllStaffs().subscribe({
      next: (staffs) => {
        this.staffList = staffs;
      },
      error: (error) => {
        console.error('Error loading staff:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load staff list',
          confirmButtonColor: '#800020'
        });
      }
    });
  }

  loadSalaryRecords(): void {
    this.isLoading = true;
    this.staffSalaryService.getStaffSalaries().subscribe({
      next: (salaries) => {
        this.allSalaryData = salaries;
        this.processSalaryRecords(salaries);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading salaries:', error);
        this.isLoading = false;
        // Show error but don't block the UI
        Swal.fire({
          icon: 'warning',
          title: 'Notice',
          text: 'Could not load existing salary records. You can still create new ones.',
          confirmButtonColor: '#800020'
        });
      }
    });
  }

  processSalaryRecords(salaries: StaffSalary[]): void {
    const today = new Date();
    this.salaryRecords = salaries.map((salary, index) => ({
      id: salary.staffSalaryId,
      staffId: `EMP-${String(salary.staffSalaryId).padStart(4, '0')}`,
      staffName: salary.staffName || 'Unknown Staff',
      role: 'Staff', // You might want to get this from Staff model
      month: today.toISOString().substring(0, 7),
      date: today.toISOString().split('T')[0],
      basicSalary: salary.basicSalary || 0,
      festivalBonus: salary.festivalBonus || 0,
      allowance: salary.allowance || 0,
      medicalAllowance: salary.medicalAllowance || 0,
      housingAllowance: salary.housingAllowance || 0,
      transportationAllowance: salary.transportationAllowance || 0,
      savingFund: salary.savingFund || 0,
      taxes: salary.taxes || 0,
      netSalary: salary.netSalary || 0,
      status: 'Paid'
    }));
  }

  onSearchChange(): void {
    if (this.searchQuery.trim() === '') {
      this.filteredStaffList = [];
      this.showDropdown = false;
      return;
    }

    const query = this.searchQuery.toLowerCase();
    this.filteredStaffList = this.staffList.filter(staff =>
      staff.staffName.toLowerCase().includes(query) ||
      staff.staffId.toString().includes(query) ||
      (staff.designation !== undefined && staff.designation.toString().toLowerCase().includes(query))
    );
    this.showDropdown = this.filteredStaffList.length > 0;
  }

  selectStaff(staff: Staff): void {
    this.staffId = staff.staffId.toString();
    this.staffName = staff.staffName;
    this.staffRole = staff.designation !== undefined ? staff.designation.toString() : 'Staff';
    this.basicSalary = staff.staffSalary?.basicSalary || 0;
    this.searchQuery = staff.staffName;
    this.showDropdown = false;
  }

  get netSalary(): number {
    const totalAllowances = this.basicSalary + this.festivalBonus + this.allowance +
      this.medicalAllowance + this.housingAllowance + this.transportationAllowance;
    const totalDeductions = this.savingFund + this.taxes;
    return totalAllowances - totalDeductions;
  }

  saveSalary(): void {
    if (!this.staffId || !this.salaryMonth || !this.salaryDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a staff member and fill all required fields.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    const newSalary: StaffSalary = {
      staffSalaryId: 0,
      staffName: this.staffName,
      basicSalary: this.basicSalary,
      festivalBonus: this.festivalBonus,
      allowance: this.allowance,
      medicalAllowance: this.medicalAllowance,
      housingAllowance: this.housingAllowance,
      transportationAllowance: this.transportationAllowance,
      savingFund: this.savingFund,
      taxes: this.taxes,
      netSalary: this.netSalary
    };

    this.staffSalaryService.addStaffSalary(newSalary).subscribe({
      next: (savedSalary) => {
        const newRecord: SalaryRecord = {
          id: savedSalary.staffSalaryId,
          staffId: this.staffId,
          staffName: this.staffName,
          role: this.staffRole,
          month: this.salaryMonth,
          date: this.salaryDate,
          basicSalary: this.basicSalary,
          festivalBonus: this.festivalBonus,
          allowance: this.allowance,
          medicalAllowance: this.medicalAllowance,
          housingAllowance: this.housingAllowance,
          transportationAllowance: this.transportationAllowance,
          savingFund: this.savingFund,
          taxes: this.taxes,
          netSalary: this.netSalary,
          status: 'Paid'
        };

        this.salaryRecords.unshift(newRecord);

        Swal.fire({
          icon: 'success',
          title: 'Salary Saved!',
          text: `Salary for ${this.staffName} has been saved successfully.`,
          timer: 2000,
          showConfirmButton: false
        });

        this.resetForm();
      },
      error: (error) => {
        console.error('Error saving salary:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to save salary. Please try again.',
          confirmButtonColor: '#800020'
        });
      }
    });
  }

  resetForm(): void {
    this.searchQuery = '';
    this.staffId = '';
    this.staffName = '';
    this.staffRole = '';
    this.basicSalary = 0;
    this.festivalBonus = 0;
    this.allowance = 0;
    this.medicalAllowance = 0;
    this.housingAllowance = 0;
    this.transportationAllowance = 0;
    this.savingFund = 0;
    this.taxes = 0;
    this.setCurrentMonth();
  }

  get filteredRecords(): SalaryRecord[] {
    if (this.searchQuery.trim() === '') {
      return [];
    }

    const query = this.searchQuery.toLowerCase();
    const filtered = this.salaryRecords.filter(r =>
      r.staffName.toLowerCase().includes(query) ||
      r.staffId.toLowerCase().includes(query) ||
      r.role.toLowerCase().includes(query)
    );

    // Group by staffId and get only the latest record for each staff
    const latestRecords = new Map<string, SalaryRecord>();
    filtered.forEach(record => {
      const existing = latestRecords.get(record.staffId);
      if (!existing || new Date(record.date) > new Date(existing.date)) {
        latestRecords.set(record.staffId, record);
      }
    });

    return Array.from(latestRecords.values());
  }

  get paginatedRecords(): SalaryRecord[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredRecords.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRecords.length / this.itemsPerPage);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredRecords.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get paginationEnd(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.filteredRecords.length ? this.filteredRecords.length : end;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getMonthName(monthStr: string): string {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  getProfileInitials(name: string): string {
    const names = name.split(' ');
    return names.map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getStaffSalaryHistory(staffId: string): SalaryRecord[] {
    return this.salaryRecords.filter(r => r.staffId === staffId).sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }

  printDetailedReceipt(slip: SalaryRecord): void {
    this.selectedSlip = slip;
    setTimeout(() => {
      const printContent = document.getElementById('detailed-receipt');
      const originalContent = document.body.innerHTML;

      if (printContent) {
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
      }
    }, 100);
  }

  printThermalReceipt(slip: SalaryRecord): void {
    this.selectedSlip = slip;
    setTimeout(() => {
      const printContent = document.getElementById('thermal-receipt');
      const originalContent = document.body.innerHTML;

      if (printContent) {
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContent;
        window.location.reload();
      }
    }, 100);
  }

  deleteSalaryRecord(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this salary record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#800020',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.staffSalaryService.deleteStaffSalary(id).subscribe({
          next: () => {
            this.salaryRecords = this.salaryRecords.filter(r => r.id !== id);
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Salary record has been deleted.',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (error) => {
            console.error('Error deleting salary:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to delete salary record.',
              confirmButtonColor: '#800020'
            });
          }
        });
      }
    });
  }
}

