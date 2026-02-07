import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { StaffService } from '../../../services/staff.service';
import { AttendanceService } from '../../../services/attendance.service';
import { Staff } from '../../../Models/staff';
import { Attendance, AttendanceType } from '../../../Models/attendance';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AuthService } from '../../../SecurityModels/auth.service';
import { forkJoin } from 'rxjs';

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
  Math = Math;

  // Filters
  selectedDate: string = '';

  // Staff Data
  staffMembers: (Staff & { status?: string; remarks?: string })[] = [];
  staffLoaded = false;

  // Pagination & Search
  itemsPerPage: number = 10;
  currentPage: number = 1;
  searchQuery: string = '';

  constructor(
    private staffService: StaffService,
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.setTodayDate();
    this.loadStaff();
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  setTodayDate(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  loadStaff(): void {
    this.staffService.getAllStaffs().subscribe({
      next: (data: Staff[]) => {
        // Add status & remarks dynamically
        this.staffMembers = data.map(s => ({
          ...s,
          status: '',
          remarks: ''
        }));
        this.staffLoaded = true;
      },
      error: (err) => {
        Swal.fire('Error', 'Unable to load staff data', 'error');
        console.error(err);
      }
    });
  }

  markAllPresent(): void {
    this.staffMembers.forEach(s => s.status = 'Present');
    Swal.fire({
      icon: 'success',
      title: 'All Marked Present',
      timer: 1000,
      showConfirmButton: false
    });
  }

  markAllAbsent(): void {
    this.staffMembers.forEach(s => s.status = 'Absent');
    Swal.fire({
      icon: 'info',
      title: 'All Marked Absent',
      timer: 1000,
      showConfirmButton: false
    });
  }

  async saveAttendance(): Promise<void> {
    const markedRecords = this.staffMembers.filter(s => s.status);
    const unmarked = this.staffMembers.filter(s => !s.status);

    if (unmarked.length > 0) {
      const result = await Swal.fire({
        icon: 'warning',
        title: 'Incomplete Attendance',
        text: `${unmarked.length} staff member(s) are not marked. Continue anyway?`,
        showCancelButton: true,
        confirmButtonText: 'Yes, Save',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
      });
      if (!result.isConfirmed) return;
    }

    if (markedRecords.length === 0) {
      Swal.fire('No Data', 'No staff to mark attendance for.', 'info');
      return;
    }

    Swal.fire({
      title: 'Saving...',
      text: 'Please wait while we save the attendance.',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const attendanceRequests = markedRecords.map(s => {
      const attendance: Attendance = {
        attendanceId: 0,
        date: new Date(this.selectedDate),
        type: AttendanceType.Staff,
        attendanceIdentificationNumber: s.staffId,
        description: s.remarks || '',
        isPresent: s.status === 'Present'
      };
      return this.attendanceService.addAttendance(attendance);
    });

    forkJoin(attendanceRequests).subscribe({
      next: () => {
        Swal.fire('Saved!', 'Staff attendance saved successfully', 'success');
        this.resetForm();
      },
      error: (err) => {
        console.error('Attendance save error', err);
        Swal.fire('Error', 'Failed to save staff attendance.', 'error');
      }
    });
  }


  resetForm(): void {
    this.staffMembers = [];
    this.staffLoaded = false;
    this.setTodayDate();
    this.loadStaff();
  }

  // --- Search & Pagination ---
  get filteredStaff(): (Staff & { status?: string; remarks?: string })[] {
    if (!this.searchQuery) return this.staffMembers;
    const query = this.searchQuery.toLowerCase();
    return this.staffMembers.filter(s =>
      s.staffName?.toLowerCase().includes(query) ||
      s.staffId.toString().includes(query)
    );
  }

  get paginatedStaff(): (Staff & { status?: string; remarks?: string })[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredStaff.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStaff.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }

  get attendanceStats() {
    const present = this.staffMembers.filter(s => s.status === 'Present').length;
    const absent = this.staffMembers.filter(s => s.status === 'Absent').length;
    const unmarked = this.staffMembers.filter(s => !s.status).length;
    return { present, absent, unmarked, total: this.staffMembers.length };
  }
}
