import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { LeaveService } from '../../../services/leave.service';
import { Leave, LeaveStatus, LeaveType } from '../../../Models/leave';
import { finalize } from 'rxjs';
import * as XLSX from 'xlsx';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-leave',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './leave.component.html',
  styleUrl: './leave.component.css'
})
export class LeaveComponent implements OnInit {
  title = 'Leave Dashboard';
  Math = Math;
  Number = Number;

  // Stats
  totalLeavesCount = 0;
  pendingLeavesCount = 0;
  approvedLeavesCount = 0;
  rejectedLeavesCount = 0;

  // Recent applications
  recentApplications: Leave[] = [];
  filteredApplications: Leave[] = [];
  loading = false;

  // Pagination
  rowsPerPage = 10;
  currentPage = 1;

  // Detail Modal
  showDetailModal = false;
  selectedLeave: Leave | null = null;

  constructor(
    private leaveService: LeaveService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadLeaveData();
  }

  // Modals are now handled by PopupService

  loadLeaveData(): void {
    this.loading = true;
    this.leaveService.getLeaves()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.recentApplications = data.map(leave => ({
            ...leave,
            status: typeof leave.status === 'string'
              ? LeaveStatus[leave.status as keyof typeof LeaveStatus]
              : leave.status,
            leaveType: typeof leave.leaveType === 'string'
              ? LeaveType[leave.leaveType as keyof typeof LeaveType]
              : leave.leaveType
          }));
          this.filteredApplications = [...this.recentApplications];
          this.calculateStats();
        },
        error: (err) => {
          console.error('Error loading leaves:', err);
          this.popup.error('Error', 'Failed to load leave data');
        }
      });
  }

  calculateStats(): void {
    this.totalLeavesCount = this.recentApplications.length;
    this.pendingLeavesCount = this.recentApplications.filter(l => Number(l.status) === LeaveStatus.Pending).length;
    this.approvedLeavesCount = this.recentApplications.filter(l => Number(l.status) === LeaveStatus.Approved).length;
    this.rejectedLeavesCount = this.recentApplications.filter(l => Number(l.status) === LeaveStatus.Rejected).length;
  }

  getLeaveTypeName(type: any): string { return LeaveType[Number(type)] ?? 'Unknown'; }
  getLeaveStatusName(status: any): string { return LeaveStatus[Number(status)] ?? 'Unknown'; }

  getStatusClass(status: number): string {
    switch (status) {
      case LeaveStatus.Approved: return 'bg-success-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case LeaveStatus.Pending: return 'bg-warning-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case LeaveStatus.Rejected: return 'bg-danger-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      default: return 'bg-neutral-200 text-neutral-900 px-24 py-4 radius-4 fw-medium text-sm';
    }
  }

  refreshData(): void {
    this.loadLeaveData();
    this.popup.success('Refreshed!', 'Data refreshed successfully.');
  }

  exportData(): void {
    if (!this.recentApplications.length) {
      this.popup.warning('No Data', 'There is no leave data to export.');
      return;
    }
    const rows = this.recentApplications.map((l, i) => ({
      '#': i + 1,
      'Employee': l.staff?.staffName || 'N/A',
      'Designation': l.staff?.designation || 'N/A',
      'Leave Type': this.getLeaveTypeName(l.leaveType),
      'From': new Date(l.startDate).toLocaleDateString(),
      'To': new Date(l.endDate).toLocaleDateString(),
      'Reason': l.reason,
      'Status': this.getLeaveStatusName(l.status),
      'Applied Date': l.appliedDate ? new Date(l.appliedDate).toLocaleDateString() : 'N/A',
      'Admin Remarks': l.adminRemarks || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Report');
    XLSX.writeFile(wb, `Leave_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  viewDetails(leave: Leave): void {
    this.selectedLeave = leave;
    this.showDetailModal = true;
  }
  closeDetailModal(): void { this.showDetailModal = false; this.selectedLeave = null; }

  get paginatedApplications(): Leave[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredApplications.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredApplications.length / this.rowsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}
