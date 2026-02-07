import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { LeaveService } from '../../../services/leave.service';
import { Leave, LeaveStatus, LeaveType } from '../../../Models/leave';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

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

  constructor(private leaveService: LeaveService) { }

  ngOnInit(): void {
    this.loadLeaveData();
  }

  loadLeaveData(): void {
    this.loading = true;
    this.leaveService.getLeaves()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.recentApplications = data;
          this.filteredApplications = [...data];
          this.calculateStats();
        },
        error: (err) => {
          console.error('Error loading leaves:', err);
          Swal.fire('Error', 'Failed to load leave data', 'error');
        }
      });
  }

  calculateStats(): void {
    this.totalLeavesCount = this.recentApplications.length;
    this.pendingLeavesCount = this.recentApplications.filter(l => l.status === LeaveStatus.Pending).length;
    this.approvedLeavesCount = this.recentApplications.filter(l => l.status === LeaveStatus.Approved).length;
    this.rejectedLeavesCount = this.recentApplications.filter(l => l.status === LeaveStatus.Rejected).length;
  }

  getLeaveTypeName(type: number): string {
    return LeaveType[type];
  }

  getLeaveStatusName(status: number): string {
    return LeaveStatus[status];
  }

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
    Swal.fire({
      icon: 'success',
      title: 'Refreshed!',
      text: 'Data refreshed successfully.',
      timer: 1500,
      showConfirmButton: false
    });
  }

  exportData(): void {
    Swal.fire({
      icon: 'info',
      title: 'Export',
      text: 'Export functionality will be implemented soon.',
      confirmButtonColor: '#800020'
    });
  }

  viewDetails(leave: Leave): void {
    Swal.fire({
      title: 'Leave Details',
      html: `
        <div class="text-start">
          <p><strong>Employee:</strong> ${leave.staff?.staffName || 'Unknown'}</p>
          <p><strong>Leave Type:</strong> ${this.getLeaveTypeName(leave.leaveType)}</p>
          <p><strong>From:</strong> ${new Date(leave.startDate).toLocaleDateString()}</p>
          <p><strong>To:</strong> ${new Date(leave.endDate).toLocaleDateString()}</p>
          <p><strong>Reason:</strong> ${leave.reason}</p>
          <p><strong>Applied On:</strong> ${new Date(leave.appliedDate!).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${this.getLeaveStatusName(leave.status)}</p>
        </div>
      `,
      confirmButtonColor: '#800020'
    });
  }

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
