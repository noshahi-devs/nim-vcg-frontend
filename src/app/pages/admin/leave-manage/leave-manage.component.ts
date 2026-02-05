import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { LeaveService } from '../../../services/leave.service';
import { Leave, LeaveStatus, LeaveType } from '../../../Models/leave';
import { AuthService } from '../../../SecurityModels/auth.service';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

declare var bootstrap: any;

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

  // All leaves
  allLeaves: Leave[] = [];
  filteredLeaves: Leave[] = [];
  loading = false;

  // Filters
  statusFilter = 'All';
  leaveTypeFilter = 'All';

  // Pagination
  rowsPerPage = 10;
  currentPage = 1;

  // Modal
  showModal = false;
  modalAction: 'approve' | 'reject' = 'approve';
  selectedLeave: Leave | null = null;
  remarks = '';

  // Leave types for filter
  leaveTypes = Object.keys(LeaveType).filter(key => isNaN(Number(key)));

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadAllLeaves();
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  loadAllLeaves(): void {
    this.loading = true;
    this.leaveService.getLeaves()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.allLeaves = data;
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error loading leaves:', err);
          Swal.fire('Error', 'Failed to load leave requests', 'error');
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.allLeaves];

    // Status filter
    if (this.statusFilter !== 'All') {
      const statusValue = LeaveStatus[this.statusFilter as keyof typeof LeaveStatus];
      filtered = filtered.filter(leave => leave.status === statusValue);
    }

    // Leave type filter
    if (this.leaveTypeFilter !== 'All') {
      const typeValue = LeaveType[this.leaveTypeFilter as keyof typeof LeaveType];
      filtered = filtered.filter(leave => leave.leaveType === typeValue);
    }

    this.filteredLeaves = filtered;
    this.currentPage = 1;
  }

  refreshData(): void {
    this.loadAllLeaves();
    Swal.fire({
      icon: 'success',
      title: 'Refreshed!',
      text: 'Data has been refreshed successfully.',
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

  openApproveModal(leave: Leave): void {
    this.selectedLeave = leave;
    this.modalAction = 'approve';
    this.remarks = '';
    this.showModal = true;
  }

  openRejectModal(leave: Leave): void {
    this.selectedLeave = leave;
    this.modalAction = 'reject';
    this.remarks = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedLeave = null;
    this.remarks = '';
  }

  confirmAction(): void {
    if (!this.selectedLeave || !this.selectedLeave.leaveId) return;

    if (!this.remarks.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Remarks Required',
        text: 'Please provide remarks for this action.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    const newStatus = this.modalAction === 'approve' ? LeaveStatus.Approved : LeaveStatus.Rejected;
    const adminId = 1; // Placeholder: In real app, get from auth service

    this.leaveService.updateLeaveStatus(this.selectedLeave.leaveId, {
      status: newStatus,
      adminId: adminId,
      remarks: this.remarks
    }).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: `Leave ${this.modalAction === 'approve' ? 'Approved' : 'Rejected'}!`,
          confirmButtonColor: '#800020',
          timer: 2000
        });
        this.loadAllLeaves();
        this.closeModal();
      },
      error: (err) => {
        console.error('Error updating leave status:', err);
        Swal.fire('Error', 'Failed to update leave status', 'error');
      }
    });
  }

  getLeaveTypeName(type: number): string {
    return LeaveType[type];
  }

  getLeaveStatusName(status: number): string {
    return LeaveStatus[status];
  }

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

  // Statistics
  get totalLeaves(): number {
    return this.allLeaves.length;
  }

  get pendingLeaves(): number {
    return this.allLeaves.filter(l => l.status === LeaveStatus.Pending).length;
  }

  get approvedLeaves(): number {
    return this.allLeaves.filter(l => l.status === LeaveStatus.Approved).length;
  }

  get rejectedLeaves(): number {
    return this.allLeaves.filter(l => l.status === LeaveStatus.Rejected).length;
  }

  // Pagination
  get paginatedLeaves(): Leave[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredLeaves.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredLeaves.length / this.rowsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
}
