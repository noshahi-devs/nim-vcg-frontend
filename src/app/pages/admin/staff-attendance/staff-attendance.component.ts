import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../../services/staff.service';
import { AttendanceService } from '../../../services/attendance.service';
import { Staff } from '../../../Models/staff';
import { Attendance, AttendanceType } from '../../../Models/attendance';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize, forkJoin } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

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
  loading = false;

  // Permissions
  canMarkAttendance = false;

  /** PREMIUM UI STATES */
  isProcessing = false;
  pendingRecords: any[] = [];

  // Pagination & Search
  itemsPerPage: number = 10;
  currentPage: number = 1;
  searchQuery: string = '';

  constructor(
    private staffService: StaffService,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private popup: PopupService
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
    this.loading = true;
    this.attendanceService.getDailyStaffAttendance(this.selectedDate).pipe(finalize(() => this.loading = false)).subscribe({
      next: (data: any[]) => {
        // Map the backend report flat data back into staff array
        this.staffMembers = data.map(record => ({
          staffId: record.staffId,
          staffName: record.staffName,
          designation: record.designation,
          status: record.status || '',
          remarks: record.remarks || ''
        })) as any[];

      },
      error: (err) => {
        this.popup.error('Error', 'Unable to load staff data');
        console.error(err);
      }
    });
  }

  markAllPresent(): void {
    this.staffMembers.forEach(s => s.status = 'Present');
    this.popup.success('Updated', 'All Marked Present');
  }

  markAllAbsent(): void {
    this.staffMembers.forEach(s => s.status = 'Absent');
    this.popup.success('Updated', 'All Marked Absent');
  }

  saveAttendance(): void {
    const markedRecords = this.staffMembers.filter(s => s.status);
    const unmarked = this.staffMembers.filter(s => !s.status);

    if (markedRecords.length === 0) {
      this.popup.warning('No Data', 'No staff to mark attendance for.');
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
      this.popup.confirm(
        'Incomplete Attendance',
        'Some staff members are not marked. Do you want to save anyway?',
        'Yes, Save',
        'Review'
      ).then(confirmed => {
        if (confirmed) this.confirmSave();
      });
    } else {
      this.confirmSave();
    }
  }

  confirmSave(): void {
    this.isProcessing = true;
    this.popup.loading('Saving staff attendance...');

    forkJoin(this.pendingRecords).subscribe({
      next: () => {
        this.isProcessing = false;
        this.popup.success('Saved!', 'Staff attendance saved successfully');
        this.resetForm();
      },
      error: (err) => {
        console.error('Attendance save error', err);
        this.isProcessing = false;
        this.popup.error('Error', 'Failed to save staff attendance.');
      }
    });
  }


  resetForm(): void {
    this.staffMembers = [];
    this.loading = false;
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

  closeFeedback() {
    // legacy
  }

  showFetchedAttendance = false;
  isFetchingFromMachine = false;

  machineConfig = {
    machineId: 1005,
    machineNo: 106,
    machineName: 'ALFATAH SIALKOT',
    ip: '119.153.103.71',
    port: 4370,
    commKey: 0
  };

  fetchedAttendanceRows: Array<{
    srNo: number;
    employeeId: string;
    name: string;
    attendance: string;
    leaveCategory: string;
    date: string;
    inTime: string;
    outTime: string;
    remarks: string;
  }> = [];

  fetchAttendancePreview(): void {
    if (this.isFetchingFromMachine) return;

    this.isFetchingFromMachine = true;
    this.popup.loading('Fetching attendance from biometric machine...');

    const payload = {
      ...this.machineConfig,
      date: this.selectedDate
    };

    this.attendanceService.fetchStaffAttendanceFromMachine(payload).subscribe({
      next: (response: any) => {
        const rows = Array.isArray(response?.rows) ? response.rows : [];
        this.fetchedAttendanceRows = rows.map((row: any, idx: number) => ({
          srNo: row.srNo ?? idx + 1,
          employeeId: row.employeeId ?? '',
          name: row.name ?? '',
          attendance: row.attendance ?? '',
          leaveCategory: row.leaveCategory ?? '',
          date: row.date ?? '',
          inTime: row.inTime ?? '',
          outTime: row.outTime ?? '',
          remarks: row.remarks ?? ''
        }));

        this.showFetchedAttendance = true;
        this.popup.closeLoading();
        this.popup.success('Fetched', `Attendance fetched: ${this.fetchedAttendanceRows.length} row(s).`);
      },
      error: (err) => {
        this.isFetchingFromMachine = false;
        this.popup.closeLoading();
        const message = err?.error?.message || 'Unable to fetch attendance from biometric machine.';
        this.popup.error('Fetch Failed', message);
        console.error(err);
      },
      complete: () => {
        this.isFetchingFromMachine = false;
      }
    });
  }
}


