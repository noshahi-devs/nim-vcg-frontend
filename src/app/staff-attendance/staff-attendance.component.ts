import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

declare var bootstrap: any;

interface Staff {
  id: number;
  serialNo: number;
  name: string;
  employeeId: string;
  department: string;
  status: string;
  remarks: string;
}

interface AttendanceHistory {
  date: string;
  present: number;
  absent: number;
  leave: number;
  late: number;
  total: number;
}

@Component({
  selector: 'app-staff-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './staff-attendance.component.html',
  styleUrls: ['./staff-attendance.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StaffAttendanceComponent implements OnInit {
  title = 'Staff Attendance';

  // Filters
  selectedDepartment: string = '';
  selectedDate: string = '';

  // Filter Options
  departments = ['Teaching', 'Administration', 'IT', 'Accounts', 'Library', 'Transport'];

  // Staff Data
  staffMembers: Staff[] = [];
  staffLoaded = false;

  // Pagination & Search
  itemsPerPage: number = 10;
  currentPage: number = 1;
  searchQuery: string = '';

  // Attendance History
  attendanceHistory: AttendanceHistory[] = [];
  historyStartDate: string = '';
  historyEndDate: string = '';

  // Status options
  statusOptions = ['Present', 'Absent', 'Leave', 'Late'];

  ngOnInit(): void {
    this.setTodayDate();
    this.generateDummyHistory();
  }

  setTodayDate(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  loadStaff(): void {
    if (!this.selectedDepartment || !this.selectedDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Filters',
        text: 'Please select Department and Date before loading staff.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    // Generate dummy staff
    this.staffMembers = this.generateDummyStaff();
    this.staffLoaded = true;

    Swal.fire({
      icon: 'success',
      title: 'Staff Loaded',
      text: `${this.staffMembers.length} staff members loaded successfully.`,
      timer: 1500,
      showConfirmButton: false
    });
  }

  generateDummyStaff(): Staff[] {
    const names = [
      'Ali Hassan', 'Sara Ahmed', 'Usman Khan', 'Ayesha Malik',
      'Bilal Raza', 'Fatima Noor', 'Hamza Tariq', 'Zainab Riaz',
      'Abdullah Iqbal', 'Maryam Khalid', 'Arslan Javed', 'Hira Akram',
      'Kamran Ali', 'Nida Yousaf', 'Faisal Hussain', 'Amna Asif'
    ];

    return names.map((name, index) => ({
      id: index + 1,
      serialNo: index + 1,
      name: name,
      employeeId: `EMP-${String(index + 1).padStart(4, '0')}`,
      department: this.selectedDepartment,
      status: '',
      remarks: ''
    }));
  }

  markAllPresent(): void {
    this.staffMembers.forEach(staff => staff.status = 'Present');
    Swal.fire({
      icon: 'success',
      title: 'All Marked Present',
      timer: 1000,
      showConfirmButton: false
    });
  }

  markAllAbsent(): void {
    this.staffMembers.forEach(staff => staff.status = 'Absent');
    Swal.fire({
      icon: 'info',
      title: 'All Marked Absent',
      timer: 1000,
      showConfirmButton: false
    });
  }

  async saveAttendance(): Promise<void> {
    const unmarked = this.staffMembers.filter(s => !s.status);
    if (unmarked.length > 0) {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Incomplete Attendance',
        text: `${unmarked.length} staff member(s) have no status marked. Continue anyway?`,
        showCancelButton: true,
        confirmButtonText: 'Yes, Save',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#800020',
        cancelButtonColor: '#6c757d'
      });

      if (!result.isConfirmed) return;
    }

    // Save to localStorage
    const attendanceData = {
      date: this.selectedDate,
      department: this.selectedDepartment,
      staff: this.staffMembers,
      savedAt: new Date().toISOString()
    };

    const savedAttendance = JSON.parse(localStorage.getItem('staffAttendance') || '[]');
    savedAttendance.push(attendanceData);
    localStorage.setItem('staffAttendance', JSON.stringify(savedAttendance));

    await Swal.fire({
      icon: 'success',
      title: 'Attendance Saved!',
      text: 'Staff attendance has been saved successfully.',
      confirmButtonColor: '#800020'
    });

    this.resetForm();
  }

  resetForm(): void {
    this.staffMembers = [];
    this.staffLoaded = false;
    this.selectedDepartment = '';
    this.setTodayDate();
  }

  openHistoryModal(): void {
    const modal = new bootstrap.Modal(document.getElementById('historyModal'));
    modal.show();
  }

  generateDummyHistory(): void {
    const today = new Date();
    this.attendanceHistory = [];

    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const total = 16;
      const present = Math.floor(Math.random() * 3) + 13;
      const absent = Math.floor(Math.random() * 2);
      const leave = Math.floor(Math.random() * 2);
      const late = total - present - absent - leave;

      this.attendanceHistory.push({
        date: date.toISOString().split('T')[0],
        present,
        absent,
        leave,
        late,
        total
      });
    }
  }

  get filteredHistory(): AttendanceHistory[] {
    if (!this.historyStartDate && !this.historyEndDate) {
      return this.attendanceHistory;
    }

    return this.attendanceHistory.filter(record => {
      const recordDate = new Date(record.date);
      const start = this.historyStartDate ? new Date(this.historyStartDate) : null;
      const end = this.historyEndDate ? new Date(this.historyEndDate) : null;

      if (start && recordDate < start) return false;
      if (end && recordDate > end) return false;
      return true;
    });
  }

  get filteredStaff(): Staff[] {
    if (!this.searchQuery) {
      return this.staffMembers;
    }
    const query = this.searchQuery.toLowerCase();
    return this.staffMembers.filter(s => 
      s.name.toLowerCase().includes(query) || 
      s.employeeId.toLowerCase().includes(query)
    );
  }

  get paginatedStaff(): Staff[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredStaff.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStaff.length / this.itemsPerPage);
  }

  get totalPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get paginationStart(): number {
    return this.filteredStaff.length === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get paginationEnd(): number {
    const end = this.currentPage * this.itemsPerPage;
    return end > this.filteredStaff.length ? this.filteredStaff.length : end;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get attendanceStats() {
    const present = this.staffMembers.filter(s => s.status === 'Present').length;
    const absent = this.staffMembers.filter(s => s.status === 'Absent').length;
    const leave = this.staffMembers.filter(s => s.status === 'Leave').length;
    const late = this.staffMembers.filter(s => s.status === 'Late').length;
    const unmarked = this.staffMembers.filter(s => !s.status).length;

    return { present, absent, leave, late, unmarked, total: this.staffMembers.length };
  }
}
