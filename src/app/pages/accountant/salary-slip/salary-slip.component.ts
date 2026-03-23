import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from '../../../swal';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffSalaryService } from '../../../services/staff-salary.service';
import { StaffService } from '../../../services/staff.service';
import { SettingsService } from '../../../services/settings.service';
import { StaffSalary } from '../../../Models/staff-salary';
import { Staff } from '../../../Models/staff';
import { environment } from '../../../../environments/environment';

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
  imagePath?: string;
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

  // School Info for reports
  schoolInfo: any = {};
  printType: 'detailed' | 'thermal' | null = null;

  // API base URL for images
  private apiBaseUrl = environment.apiBaseUrl;

  // Loading and Modal states
  isProcessing: boolean = false;
  showFeedbackModal: boolean = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle: string = '';
  feedbackMessage: string = '';

  showDeleteModal: boolean = false;
  slipToDeleteId: number | null = null;

  constructor(
    private staffSalaryService: StaffSalaryService,
    private staffService: StaffService,
    private settingsService: SettingsService
  ) { }

  ngOnInit(): void {
    this.setCurrentMonth();
    this.loadStaffList();
    this.loadSalaryRecords();
    this.loadSchoolInfo();
  }

  loadSchoolInfo(): void {
    this.settingsService.getSchoolInfo().subscribe(info => {
      this.schoolInfo = info;
    });
  }

  /* ================= GETTERS FOR STATS ================= */
  get totalDisbursement(): number {
    return this.allSalaryData.reduce((acc, s) => acc + (s.netSalary || 0), 0);
  }

  get averageSlip(): number {
    return this.allSalaryData.length > 0 ? this.totalDisbursement / this.allSalaryData.length : 0;
  }

  get totalPaidSlips(): number {
    return this.allSalaryData.length;
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
        if (this.allSalaryData.length > 0) {
          this.processSalaryRecords(this.allSalaryData);
        }
      },
      error: (error) => {
        console.error('Error loading staff:', error);
        this.showFeedback('error', 'Error', 'Failed to load staff list');
      }
    });
  }

  loadSalaryRecords(): void {
    this.isProcessing = true;
    this.staffSalaryService.getStaffSalaries().subscribe({
      next: (salaries) => {
        this.allSalaryData = salaries;
        this.processSalaryRecords(salaries);
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('Error loading salaries:', error);
        this.isProcessing = false;
        // Show error but don't block the UI
        this.showFeedback('warning', 'Notice', 'Could not load existing salary records. You can still create new ones.');
      }
    });
  }

  processSalaryRecords(salaries: StaffSalary[]): void {
    const today = new Date();
    this.salaryRecords = salaries.map((salary) => {
      // Find staff to get image
      const staffMatch = this.staffList.find(s =>
        s.staffId === Number(salary.staffId) ||
        s.staffName === salary.staffName
      );

      // Use stored date if available, otherwise fallback to today
      const rawDate = salary.paymentDate;
      let displayDate = '';
      if (rawDate) {
        displayDate = new Date(rawDate).toISOString().split('T')[0];
      } else {
        displayDate = today.toISOString().split('T')[0];
      }

      const netSalary = salary.netSalary || (
        (salary.basicSalary || 0) +
        (salary.festivalBonus || 0) +
        (salary.allowance || 0) +
        (salary.medicalAllowance || 0) +
        (salary.housingAllowance || 0) +
        (salary.transportationAllowance || 0) -
        (salary.savingFund || 0) -
        (salary.taxes || 0)
      );

      return {
        id: salary.staffSalaryId || 0,
        staffId: salary.staffId ? `EMP-${String(salary.staffId).padStart(4, '0')}` : (staffMatch ? `EMP-${String(staffMatch.staffId).padStart(4, '0')}` : 'EMP-0000'),
        staffName: salary.staffName || '',
        basicSalary: salary.basicSalary || 0,
        festivalBonus: salary.festivalBonus || 0,
        allowance: salary.allowance || 0,
        medicalAllowance: salary.medicalAllowance || 0,
        housingAllowance: salary.housingAllowance || 0,
        transportationAllowance: salary.transportationAllowance || 0,
        savingFund: salary.savingFund || 0,
        taxes: salary.taxes || 0,
        netSalary: netSalary,
        month: salary.paymentMonth || today.toLocaleString('default', { month: 'long' }),
        date: displayDate,
        status: 'Paid',
        role: staffMatch ? String(staffMatch.designation || 'Staff') : 'Staff',
        imagePath: staffMatch ? staffMatch.imagePath : ''
      };
    });
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
      this.showFeedback('warning', 'Missing Information', 'Please select a staff member and fill all required fields.');
      return;
    }

    this.isProcessing = true;

    const newSalary: StaffSalary = {
      staffSalaryId: 0,
      staffName: this.staffName,
      staffId: Number(this.staffId),
      paymentMonth: this.salaryMonth,
      paymentDate: this.salaryDate,
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

        this.isProcessing = false;
        this.showFeedback('success', 'Salary Saved!', `Salary for ${this.staffName} has been saved successfully.`);

        this.resetForm();
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Error saving salary:', error);
        this.showFeedback('error', 'Error', 'Failed to save salary. Please try again.');
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
    if (!monthStr) return '';
    if (monthStr.length > 10) return monthStr; // Already formatted

    let date: Date;
    if (monthStr.includes('-')) {
      // Handle YYYY-MM
      date = new Date(monthStr + '-01');
    } else {
      // Handle plain month name like 'March'
      date = new Date(monthStr + ' 01, ' + new Date().getFullYear());
    }

    if (isNaN(date.getTime())) return monthStr; // Fallback
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
    this.printType = 'detailed';

    // Give Angular time to render the template in the background
    setTimeout(() => {
      this.executePrint('detailed-receipt');
    }, 300);
  }

  printThermalReceipt(slip: SalaryRecord): void {
    this.selectedSlip = slip;
    this.printType = 'thermal';

    // Give Angular time to render the template in the background
    setTimeout(() => {
      this.executePrint('thermal-receipt');
    }, 300);
  }

  private executePrint(elementId: string): void {
    const printElement = document.getElementById(elementId);
    if (!printElement) {
      console.error('Print element not found:', elementId);
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      const content = printElement.innerHTML;
      const thermalStyles = elementId === 'thermal-receipt' ? `
        body { width: 80mm; margin: 0 auto; font-family: 'Courier New', monospace; }
        @page { size: auto; margin: 5mm; }
      ` : `
        body { font-family: Arial, sans-serif; padding: 20px; }
        @page { size: A4 portrait; margin: 15mm; }
      `;

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Receipt</title>
            <style>
              ${thermalStyles}
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
              th { background-color: #800000 !important; color: white !important; font-weight: bold !important; text-transform: uppercase; font-size: 10pt; }
              .text-success { color: #28a745 !important; }
              .text-danger { color: #dc3545 !important; }
            </style>
          </head>
          <body>
            ${content}
            <script>
              window.onload = function() {
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();

      // Cleanup
      this.printType = null;
    }
  }

  getStaffImageByStaffName(name: string): string {
    if (!name || !this.staffList || this.staffList.length === 0) return '';
    const cleanName = name.trim().toLowerCase();
    const staffMatch = this.staffList.find(s =>
      s.staffName?.trim().toLowerCase() === cleanName
    );
    return this.getStaffImage(staffMatch?.imagePath);
  }

  getStaffImage(imagePath: string | undefined): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('data:')) return imagePath;
    if (imagePath.startsWith('http')) return imagePath;
    return `${this.apiBaseUrl}/${imagePath}`;
  }

  getSchoolLogo(): string {
    if (this.schoolInfo && this.schoolInfo.logoUrl) {
      if (this.schoolInfo.logoUrl.startsWith('http')) return this.schoolInfo.logoUrl;
      return `${this.apiBaseUrl}/${this.schoolInfo.logoUrl}`;
    }
    // Fallback to absolute path for assets
    return window.location.origin + '/assets/img/vision_logo.png';
  }

  deleteSalaryRecord(id: number): void {
    this.slipToDeleteId = id;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (!this.slipToDeleteId) return;

    this.isProcessing = true;
    this.staffSalaryService.deleteStaffSalary(this.slipToDeleteId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.salaryRecords = this.salaryRecords.filter(r => r.id !== this.slipToDeleteId);
        this.showDeleteModal = false;
        this.slipToDeleteId = null;
        this.showFeedback('success', 'Deleted!', 'Salary record has been deleted.');
      },
      error: (error) => {
        this.isProcessing = false;
        console.error('Error deleting salary:', error);
        this.showDeleteModal = false;
        this.slipToDeleteId = null;
        this.showFeedback('error', 'Error', 'Failed to delete salary record.');
      }
    });
  }

  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string): void {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  closeFeedback(): void {
    this.showFeedbackModal = false;
  }
}



