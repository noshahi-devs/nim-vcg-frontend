import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { LeaveService } from '../../../services/leave.service';
import { Leave, LeaveStatus, LeaveType } from '../../../Models/leave';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize } from 'rxjs';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-leave-manage',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './leave-manage.component.html',
  styleUrl: './leave-manage.component.css'
})
export class LeaveManageComponent implements OnInit {
  title = 'Manage Leaves';
  Math = Math;

  allLeaves: Leave[] = [];
  filteredLeaves: Leave[] = [];
  loading = false;

  statusFilter = 'All';
  leaveTypeFilter = 'All';

  rowsPerPage = 10;
  currentPage = 1;

  showModal = false;
  modalAction: 'approve' | 'reject' = 'approve';
  selectedLeave: Leave | null = null;
  remarks = '';

  leaveTypes = Object.keys(LeaveType).filter(key => isNaN(Number(key)));

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService
  ) { }

  ngOnInit(): void { this.loadAllLeaves(); }

  hasRole(role: string): boolean { return this.authService.hasRole(role); }

  // ── Helpers ──
  triggerSuccess(title: string, msg: string) {
    this.feedbackType = 'success'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerError(title: string, msg: string) {
    this.feedbackType = 'error'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerWarning(title: string, msg: string) {
    this.feedbackType = 'warning'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  closeFeedback() { this.showFeedbackModal = false; }

  loadAllLeaves(): void {
    this.loading = true;
    this.leaveService.getLeaves()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.allLeaves = data.map(leave => ({
            ...leave,
            status: typeof leave.status === 'string' ? LeaveStatus[leave.status as keyof typeof LeaveStatus] : leave.status,
            leaveType: typeof leave.leaveType === 'string' ? LeaveType[leave.leaveType as keyof typeof LeaveType] : leave.leaveType
          }));
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error loading leaves:', err);
          this.triggerError('Error', 'Failed to load leave requests');
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.allLeaves];
    if (this.statusFilter !== 'All') {
      const statusValue = LeaveStatus[this.statusFilter as keyof typeof LeaveStatus];
      filtered = filtered.filter(leave => leave.status === statusValue);
    }
    if (this.leaveTypeFilter !== 'All') {
      const typeValue = LeaveType[this.leaveTypeFilter as keyof typeof LeaveType];
      filtered = filtered.filter(leave => leave.leaveType === typeValue);
    }
    this.filteredLeaves = filtered;
    this.currentPage = 1;
  }

  refreshData(): void {
    this.loadAllLeaves();
    this.triggerSuccess('Refreshed!', 'Data has been refreshed successfully.');
  }

  exportData(): void {
    if (this.filteredLeaves.length === 0) {
      this.triggerWarning('No Data', 'There is no data to export.');
      return;
    }

    const exportData = this.filteredLeaves.map((l, index) => ({
      'S.No': index + 1,
      'Staff Name': l.staff?.staffName || 'N/A',
      'Designation': l.staff?.designation || 'N/A',
      'Leave Type': this.getLeaveTypeName(l.leaveType),
      'Start Date': new Date(l.startDate).toLocaleDateString(),
      'End Date': new Date(l.endDate).toLocaleDateString(),
      'Days': this.getDurationDays(l.startDate, l.endDate),
      'Reason': l.reason,
      'Status': this.getLeaveStatusName(l.status),
      'Applied Date': new Date(l.appliedDate).toLocaleDateString(),
      'Admin Remarks': l.adminRemarks || ''
    }));

    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Requests');

    /* generate file and force a download */
    XLSX.writeFile(wb, `Leave_Report_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    this.triggerSuccess('Exported!', 'Excel file has been downloaded successfully.');
  }

  openApproveModal(leave: Leave): void {
    this.selectedLeave = leave; this.modalAction = 'approve'; this.remarks = ''; this.showModal = true;
  }

  openRejectModal(leave: Leave): void {
    this.selectedLeave = leave; this.modalAction = 'reject'; this.remarks = ''; this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false; this.selectedLeave = null; this.remarks = '';
  }

  confirmAction(): void {
    if (!this.selectedLeave || !this.selectedLeave.leaveId) return;
    if (!this.remarks.trim()) {
      this.triggerWarning('Remarks Required', 'Please provide remarks for this action.');
      return;
    }

    const leaveId = this.selectedLeave.leaveId;
    const remarkValue = this.remarks;
    const newStatus = this.modalAction === 'approve' ? LeaveStatus.Approved : LeaveStatus.Rejected;
    const adminId = 1;
    this.isProcessing = true;
    this.closeModal();

    this.leaveService.updateLeaveStatus(leaveId, {
      status: newStatus, adminId, remarks: remarkValue
    }).pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: () => {
          this.triggerSuccess(
            `Leave ${this.modalAction === 'approve' ? 'Approved' : 'Rejected'}!`,
            `The leave request has been ${this.modalAction === 'approve' ? 'approved' : 'rejected'} successfully.`
          );
          this.loadAllLeaves();
        },
        error: (err) => {
          console.error('Error updating leave status:', err);
          this.triggerError('Error', 'Failed to update leave status');
        }
      });
  }

  getLeaveTypeName(type: number): string { return LeaveType[type]; }
  getLeaveStatusName(status: number): string { return LeaveStatus[status]; }

  getStatusClass(status: number): string {
    switch (status) {
      case LeaveStatus.Approved: return 'bg-success-600 text-white px-12 py-4 radius-4 fw-medium text-sm';
      case LeaveStatus.Pending: return 'bg-warning-600 text-white px-12 py-4 radius-4 fw-medium text-sm';
      case LeaveStatus.Rejected: return 'bg-danger-600 text-white px-12 py-4 radius-4 fw-medium text-sm';
      case LeaveStatus.Cancelled: return 'bg-neutral-600 text-white px-12 py-4 radius-4 fw-medium text-sm';
      default: return 'bg-neutral-200 text-neutral-900 px-12 py-4 radius-4 fw-medium text-sm';
    }
  }

  getDurationDays(start: any, end: any): number {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  get totalLeaves(): number { return this.allLeaves.length; }
  get pendingLeaves(): number { return this.allLeaves.filter(l => l.status == LeaveStatus.Pending).length; }
  get approvedLeaves(): number { return this.allLeaves.filter(l => l.status == LeaveStatus.Approved).length; }
  get rejectedLeaves(): number { return this.allLeaves.filter(l => l.status == LeaveStatus.Rejected).length; }

  get paginatedLeaves(): Leave[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredLeaves.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number { return Math.ceil(this.filteredLeaves.length / this.rowsPerPage); }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}
