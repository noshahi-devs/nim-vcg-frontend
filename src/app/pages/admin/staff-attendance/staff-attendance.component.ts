import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  // Permissions
  canMarkAttendance = false;

  /** PREMIUM UI STATES */
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  
  showConfirmModal = false;
  pendingRecords: any[] = [];

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

    // The user requested Admin and Principal only 'view' attendance.
    // Teachers mark their own in the MyAttendanceComponent.
    this.canMarkAttendance = false;
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  setTodayDate(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
  }

  loadStaff(): void {
    this.attendanceService.getDailyStaffAttendance(this.selectedDate).subscribe({
      next: (data: any[]) => {
        // Map the backend report flat data back into staff array
        this.staffMembers = data.map(record => ({
          staffId: record.staffId,
          staffName: record.staffName,
          designation: record.designation,
          status: record.status || '',
          remarks: record.remarks || ''
        })) as any[];

        this.staffLoaded = true;
      },
      error: (err) => {
        this.triggerError('Error', 'Unable to load staff data');
        console.error(err);
      }
    });
  }

  markAllPresent(): void {
    this.staffMembers.forEach(s => s.status = 'Present');
    this.triggerSuccess('Updated', 'All Marked Present');
  }

  markAllAbsent(): void {
    this.staffMembers.forEach(s => s.status = 'Absent');
    this.triggerSuccess('Updated', 'All Marked Absent');
  }

  saveAttendance(): void {
    const markedRecords = this.staffMembers.filter(s => s.status);
    const unmarked = this.staffMembers.filter(s => !s.status);

    if (markedRecords.length === 0) {
      this.triggerWarning('No Data', 'No staff to mark attendance for.');
      return;
    }

    this.pendingRecords = markedRecords.map(s => {
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

    if (unmarked.length > 0) {
      this.showConfirmModal = true;
    } else {
      this.confirmSave();
    }
  }

  confirmSave(): void {
    this.showConfirmModal = false;
    this.isProcessing = true;

    forkJoin(this.pendingRecords).subscribe({
      next: () => {
        this.isProcessing = false;
        this.triggerSuccess('Saved!', 'Staff attendance saved successfully');
        this.resetForm();
      },
      error: (err) => {
        console.error('Attendance save error', err);
        this.isProcessing = false;
        this.triggerError('Error', 'Failed to save staff attendance.');
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

  // Helper Methods for Modals
  triggerSuccess(title: string, message: string) {
    this.feedbackType = 'success';
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  triggerError(title: string, message: string) {
    this.feedbackType = 'error';
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  triggerWarning(title: string, message: string) {
    this.feedbackType = 'warning';
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  closeFeedback() {
    this.showFeedbackModal = false;
  }
}


