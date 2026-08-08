import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../../services/staff.service';
import { AttendanceService } from '../../../services/attendance.service';
import { Staff } from '../../../Models/staff';
import { AttendanceType } from '../../../Models/attendance';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

type AttendanceRow = Staff & {
  status?: string; remarks?: string; checkInTime?: string; checkOutTime?: string;
  joiningDate?: string; isBeforeJoining?: boolean;
};

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
  staffMembers: AttendanceRow[] = [];
  loading = false;

  // Admin/Principal/Accountant can mark attendance manually here, alongside the biometric fetch below.
  canMarkAttendance = true;

  // Sundays are a non-working day (same rule the payroll deduction calc excludes them under) — marking
  // is disabled for the whole page when the selected date falls on one, not just per-row.
  get isSelectedDateSunday(): boolean {
    if (!this.selectedDate) return false;
    const d = new Date(this.selectedDate + 'T00:00:00');
    return !isNaN(d.getTime()) && d.getDay() === 0;
  }

  get canMarkToday(): boolean {
    return this.canMarkAttendance && !this.isSelectedDateSunday;
  }

  /** PREMIUM UI STATES */
  isProcessing = false;

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
          remarks: record.remarks || '',
          checkInTime: record.checkInTime ? this.toTimeInputValue(record.checkInTime) : '',
          checkOutTime: record.checkOutTime ? this.toTimeInputValue(record.checkOutTime) : '',
          joiningDate: record.joiningDate || undefined,
          isBeforeJoining: !!record.isBeforeJoining
        })) as any[];

      },
      error: (err) => {
        this.popup.error('Error', 'Unable to load staff data');
        console.error(err);
      }
    });
  }

  private toTimeInputValue(dateStr: string): string {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toTimeString().substring(0, 5);
  }

  markAllPresent(): void {
    if (this.isSelectedDateSunday) {
      this.popup.warning('Sunday', 'Sunday is a non-working day — attendance cannot be marked.');
      return;
    }
    this.staffMembers.filter(s => !s.isBeforeJoining).forEach(s => s.status = 'Present');
    this.popup.success('Updated', 'All Marked Present');
  }

  markAllAbsent(): void {
    if (this.isSelectedDateSunday) {
      this.popup.warning('Sunday', 'Sunday is a non-working day — attendance cannot be marked.');
      return;
    }
    this.staffMembers.filter(s => !s.isBeforeJoining).forEach(s => s.status = 'Absent');
    this.popup.success('Updated', 'All Marked Absent');
  }

  private combineDateAndTime(dateStr: string, timeStr?: string): string | null {
    if (!timeStr) return null;
    return `${dateStr}T${timeStr}:00`;
  }

  saveAttendance(): void {
    if (this.isSelectedDateSunday) {
      this.popup.warning('Sunday', 'Sunday is a non-working day — attendance cannot be marked.');
      return;
    }

    // Before-joining rows are disabled in the UI, but filter defensively too — the backend also
    // rejects these, this just avoids a pointless round trip for what it'll skip anyway.
    const eligible = this.staffMembers.filter(s => !s.isBeforeJoining);
    const markedRecords = eligible.filter(s => s.status);
    const unmarked = eligible.filter(s => !s.status);

    if (markedRecords.length === 0) {
      this.popup.warning('No Data', 'No staff to mark attendance for.');
      return;
    }

    const entries = markedRecords.map(s => ({
      attendanceIdentificationNumber: s.staffId,
      type: AttendanceType.Staff,
      date: this.selectedDate,
      isPresent: s.status === 'Present',
      description: s.remarks || (s.status === 'Leave' || s.status === 'Late' ? s.status : ''),
      checkInTime: this.combineDateAndTime(this.selectedDate, s.checkInTime),
      checkOutTime: this.combineDateAndTime(this.selectedDate, s.checkOutTime)
    }));

    if (unmarked.length > 0) {
      this.popup.confirm(
        'Incomplete Attendance',
        'Some staff members are not marked. Do you want to save anyway?',
        'Yes, Save',
        'Review'
      ).then(confirmed => {
        if (confirmed) this.submitEntries(entries);
      });
    } else {
      this.submitEntries(entries);
    }
  }

  private submitEntries(entries: any[]): void {
    this.isProcessing = true;
    this.popup.loading('Saving staff attendance...');

    this.attendanceService.bulkMarkAttendance(entries).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        const skippedCount = res?.skipped?.length || 0;
        const skippedMsg = skippedCount > 0
          ? ` ${skippedCount} row(s) skipped (before joining date).`
          : '';
        this.popup.success('Saved!', `Staff attendance saved successfully.${skippedMsg}`);
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
  get filteredStaff(): AttendanceRow[] {
    if (!this.searchQuery) return this.staffMembers;
    const query = this.searchQuery.toLowerCase();
    return this.staffMembers.filter(s =>
      s.staffName?.toLowerCase().includes(query) ||
      s.staffId.toString().includes(query)
    );
  }

  get paginatedStaff(): AttendanceRow[] {
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
  fetchFailed = false;

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
    staffId: number | null;
    employeeId: string;
    name: string;
    attendance: string;
    leaveCategory: string;
    date: string;
    inTime: string;
    outTime: string;
    inTimeRaw: string;
    outTimeRaw: string;
    remarks: string;
  }> = [];

  fetchAttendancePreview(): void {
    if (this.isFetchingFromMachine) return;

    this.isFetchingFromMachine = true;
    this.fetchFailed = false;
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
          staffId: row.staffId ?? null,
          employeeId: row.employeeId ?? '',
          name: row.name ?? '',
          attendance: row.attendance ?? '',
          leaveCategory: row.leaveCategory ?? '',
          date: row.date ?? '',
          inTime: row.inTime ?? '',
          outTime: row.outTime ?? '',
          inTimeRaw: row.inTimeRaw ?? '',
          outTimeRaw: row.outTimeRaw ?? '',
          remarks: row.remarks ?? ''
        }));

        this.showFetchedAttendance = true;
        this.popup.closeLoading();
        this.popup.success('Fetched', `Attendance fetched: ${this.fetchedAttendanceRows.length} row(s).`);
      },
      error: (err) => {
        this.isFetchingFromMachine = false;
        this.fetchFailed = true;
        this.popup.closeLoading();
        const message = err?.error?.message || 'Unable to fetch attendance from biometric machine.';
        this.popup.error('Fetch Failed', `${message} You can add attendance manually in the table below instead.`);
        console.error(err);
      },
      complete: () => {
        this.isFetchingFromMachine = false;
      }
    });
  }

  saveFetchedAttendance(): void {
    const matched = this.fetchedAttendanceRows.filter(r => r.staffId != null);
    const unmatched = this.fetchedAttendanceRows.length - matched.length;

    if (matched.length === 0) {
      this.popup.warning('Nothing to Save', 'None of the fetched rows matched a known staff member.');
      return;
    }

    const entries = matched.map(r => ({
      attendanceIdentificationNumber: r.staffId,
      type: AttendanceType.Staff,
      date: r.date ? this.ddmmyyyyToIso(r.date) : this.selectedDate,
      isPresent: true,
      description: 'Fetched from biometric machine',
      checkInTime: r.inTimeRaw || null,
      checkOutTime: r.outTimeRaw || null
    }));

    this.isProcessing = true;
    this.popup.loading('Saving fetched attendance...');

    this.attendanceService.bulkMarkAttendance(entries).subscribe({
      next: (res: any) => {
        this.isProcessing = false;
        const beforeJoiningCount = res?.skipped?.length || 0;
        const parts = [];
        if (unmatched > 0) parts.push(`${unmatched} row(s) skipped (no matching staff)`);
        if (beforeJoiningCount > 0) parts.push(`${beforeJoiningCount} row(s) skipped (before joining date)`);
        const skippedMsg = parts.length > 0 ? ` ${parts.join(', ')}.` : '';
        this.popup.success('Saved!', `Fetched attendance saved (${res?.created ?? 0} new, ${res?.updated ?? 0} updated).${skippedMsg}`);
        this.loadStaff();
      },
      error: (err) => {
        console.error('Save fetched attendance error', err);
        this.isProcessing = false;
        this.popup.error('Error', 'Failed to save fetched attendance.');
      }
    });
  }

  private ddmmyyyyToIso(ddmmyyyy: string): string {
    const parts = ddmmyyyy.split('/');
    if (parts.length !== 3) return this.selectedDate;
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  }
}
