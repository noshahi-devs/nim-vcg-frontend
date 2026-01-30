import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

interface StaffAttendanceRecord {
  id: number;
  serialNo: number;
  name: string;
  employeeId: string;
  department: string;
  date: string;
  status: string;
  remarks: string;
}

@Component({
  selector: 'app-staff-attendance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './staff-attendance-report.component.html',
  styleUrls: ['./staff-attendance-report.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StaffAttendanceReportComponent implements OnInit {
  title = 'Staff Attendance Report';

  // Date Range Options
  selectedRange: string = 'today';
  customStartDate: string = '';
  customEndDate: string = '';
  selectedDate: string = '';

  // Filters
  selectedDepartment: string = '';
  departments = ['Teaching', 'Administration', 'IT', 'Accounts', 'Library', 'Transport'];

  // Data
  attendanceRecords: StaffAttendanceRecord[] = [];
  reportLoaded: boolean = false;

  // Pagination
  itemsPerPage: number = 10;
  currentPage: number = 1;
  searchQuery: string = '';

  // Calendar
  currentMonth: Date = new Date();
  calendarDays: any[] = [];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  tempStartDate: Date | null = null;
  tempEndDate: Date | null = null;
  isSelectingRange: boolean = false;

  ngOnInit(): void {
    this.setTodayDate();
    this.generateCalendar();
  }

  setTodayDate(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
    this.customStartDate = today.toISOString().split('T')[0];
    this.customEndDate = today.toISOString().split('T')[0];
  }

  onRangeChange(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (this.selectedRange) {
      case 'today':
        this.selectedDate = today.toISOString().split('T')[0];
        this.tempStartDate = new Date(today);
        this.tempEndDate = null;
        break;
      case 'yesterday':
        startDate.setDate(today.getDate() - 1);
        this.selectedDate = startDate.toISOString().split('T')[0];
        this.tempStartDate = new Date(startDate);
        this.tempEndDate = null;
        break;
      case 'week':
        startDate.setDate(today.getDate() - 7);
        this.customStartDate = startDate.toISOString().split('T')[0];
        this.customEndDate = today.toISOString().split('T')[0];
        this.tempStartDate = new Date(startDate);
        this.tempEndDate = new Date(today);
        break;
      case 'month':
        startDate.setMonth(today.getMonth() - 1);
        this.customStartDate = startDate.toISOString().split('T')[0];
        this.customEndDate = today.toISOString().split('T')[0];
        this.tempStartDate = new Date(startDate);
        this.tempEndDate = new Date(today);
        break;
      case 'last30':
        startDate.setDate(today.getDate() - 30);
        this.customStartDate = startDate.toISOString().split('T')[0];
        this.customEndDate = today.toISOString().split('T')[0];
        this.tempStartDate = new Date(startDate);
        this.tempEndDate = new Date(today);
        break;
    }
  }

  loadReport(): void {
    if (this.selectedRange === 'custom' && (!this.customStartDate || !this.customEndDate)) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Dates',
        text: 'Please select both start and end dates for custom range.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    if (this.selectedRange !== 'custom' && this.selectedRange !== 'week' && this.selectedRange !== 'month' && this.selectedRange !== 'last30' && !this.selectedDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Date',
        text: 'Please select a date.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    // Generate dummy attendance records
    this.attendanceRecords = this.generateDummyRecords();
    this.reportLoaded = true;
    this.currentPage = 1;

    Swal.fire({
      icon: 'success',
      title: 'Report Loaded',
      text: `${this.attendanceRecords.length} records loaded successfully.`,
      timer: 1500,
      showConfirmButton: false
    });
  }

  generateDummyRecords(): StaffAttendanceRecord[] {
    const names = [
      'Ali Hassan', 'Sara Ahmed', 'Usman Khan', 'Ayesha Malik',
      'Bilal Raza', 'Fatima Noor', 'Hamza Tariq', 'Zainab Riaz',
      'Abdullah Iqbal', 'Maryam Khalid', 'Arslan Javed', 'Hira Akram',
      'Kamran Ali', 'Nida Yousaf', 'Faisal Hussain', 'Amna Asif'
    ];

    const statuses = ['Present', 'Absent', 'Leave', 'Late'];
    const records: StaffAttendanceRecord[] = [];

    // Determine date range
    let dates: string[] = [];
    if (this.selectedRange === 'custom' || this.selectedRange === 'week' || this.selectedRange === 'month' || this.selectedRange === 'last30') {
      const start = new Date(this.customStartDate);
      const end = new Date(this.customEndDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split('T')[0]);
      }
    } else {
      dates = [this.selectedDate];
    }

    let serialNo = 1;
    dates.forEach(date => {
      names.forEach((name, index) => {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        records.push({
          id: serialNo,
          serialNo: serialNo,
          name: name,
          employeeId: `EMP-${String(index + 1).padStart(4, '0')}`,
          department: this.selectedDepartment || 'Teaching',
          date: date,
          status: status,
          remarks: status === 'Absent' ? 'No reason provided' : ''
        });
        serialNo++;
      });
    });

    return records;
  }

  get filteredRecords(): StaffAttendanceRecord[] {
    if (!this.searchQuery) {
      return this.attendanceRecords;
    }
    const query = this.searchQuery.toLowerCase();
    return this.attendanceRecords.filter(r =>
      r.name.toLowerCase().includes(query) ||
      r.employeeId.toLowerCase().includes(query) ||
      r.date.includes(query)
    );
  }

  get paginatedRecords(): StaffAttendanceRecord[] {
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

  get attendanceStats() {
    const present = this.filteredRecords.filter(r => r.status === 'Present').length;
    const absent = this.filteredRecords.filter(r => r.status === 'Absent').length;
    const leave = this.filteredRecords.filter(r => r.status === 'Leave').length;
    const late = this.filteredRecords.filter(r => r.status === 'Late').length;

    return { present, absent, leave, late, total: this.filteredRecords.length };
  }

  copyToClipboard(): void {
    const data = this.filteredRecords.map(r =>
      `${r.serialNo}\t${r.name}\t${r.employeeId}\t${r.department}\t${r.date}\t${r.status}\t${r.remarks}`
    ).join('\n');

    const header = 'S.No\tName\tEmployee ID\tDepartment\tDate\tStatus\tRemarks\n';
    navigator.clipboard.writeText(header + data);

    Swal.fire({
      icon: 'success',
      title: 'Copied!',
      text: 'Data copied to clipboard',
      timer: 1500,
      showConfirmButton: false
    });
  }

  exportToPDF(): void {
    Swal.fire({
      icon: 'info',
      title: 'PDF Export',
      text: 'PDF export functionality will be implemented with a PDF library.',
      confirmButtonColor: '#800020'
    });
  }

  printReport(): void {
    window.print();
  }

  downloadCSV(): void {
    const header = 'S.No,Name,Employee ID,Department,Date,Status,Remarks\n';
    const rows = this.filteredRecords.map(r =>
      `${r.serialNo},${r.name},${r.employeeId},${r.department},${r.date},${r.status},"${r.remarks}"`
    ).join('\n');

    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Downloaded!',
      text: 'CSV file downloaded successfully',
      timer: 1500,
      showConfirmButton: false
    });
  }

  applyDateRange(): void {
    if (this.tempStartDate) {
      if (this.selectedRange === 'today' || this.selectedRange === 'yesterday') {
        this.selectedDate = this.formatDate(this.tempStartDate);
      } else {
        this.customStartDate = this.formatDate(this.tempStartDate);
        if (this.tempEndDate) {
          this.customEndDate = this.formatDate(this.tempEndDate);
        }
      }
    }

    Swal.fire({
      icon: 'success',
      title: 'Date Range Applied',
      text: 'Date range has been set successfully',
      timer: 1000,
      showConfirmButton: false
    });
  }

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    this.calendarDays = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ day: null, date: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      this.calendarDays.push({ day, date });
    }
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    this.generateCalendar();
  }

  selectDate(date: Date): void {
    if (!date) return;

    if (this.selectedRange === 'today' || this.selectedRange === 'yesterday') {
      this.tempStartDate = date;
      this.tempEndDate = null;
    } else {
      if (!this.tempStartDate || (this.tempStartDate && this.tempEndDate)) {
        this.tempStartDate = date;
        this.tempEndDate = null;
      } else {
        if (date >= this.tempStartDate) {
          this.tempEndDate = date;
        } else {
          this.tempEndDate = this.tempStartDate;
          this.tempStartDate = date;
        }
      }
    }
  }

  isDateSelected(date: Date): boolean {
    if (!date || !this.tempStartDate) return false;

    const dateStr = this.formatDate(date);
    const startStr = this.formatDate(this.tempStartDate);

    if (this.selectedRange === 'today' || this.selectedRange === 'yesterday') {
      return dateStr === startStr;
    } else {
      if (this.tempEndDate) {
        const endStr = this.formatDate(this.tempEndDate);
        return dateStr >= startStr && dateStr <= endStr;
      }
      return dateStr === startStr;
    }
  }

  isDateInRange(date: Date): boolean {
    if (!date || !this.tempStartDate || !this.tempEndDate) return false;

    const dateStr = this.formatDate(date);
    const startStr = this.formatDate(this.tempStartDate);
    const endStr = this.formatDate(this.tempEndDate);

    return dateStr > startStr && dateStr < endStr;
  }

  isToday(date: Date): boolean {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  get canApply(): boolean {
    if (this.selectedRange === 'today' || this.selectedRange === 'yesterday') {
      return this.tempStartDate !== null;
    } else {
      return this.tempStartDate !== null && this.tempEndDate !== null;
    }
  }
}
