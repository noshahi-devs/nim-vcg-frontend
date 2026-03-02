import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { LeaveService } from '../../../services/leave.service';
import { StaffService } from '../../../services/staff.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { Leave, LeaveStatus, LeaveType } from '../../../Models/leave';
import Swal from 'sweetalert2';
import { finalize, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-my-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './my-leaves.component.html',
  styleUrl: './my-leaves.component.css'
})
export class MyLeavesComponent implements OnInit {
  title = 'My Leaves';
  Math = Math;

  // Current user
  // Current user
  staffId: number | null = null;
  currentUserName = '';
  loadingProfile = false;

  // All leaves
  allLeaves: Leave[] = [];
  filteredLeaves: Leave[] = [];
  loading = false;

  // Filters
  statusFilter = 'All';
  searchQuery = '';

  // Pagination
  rowsPerPage = 10;
  currentPage = 1;

  // Sorting
  sortColumn = 'appliedDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  LeaveStatus = LeaveStatus; // For template access

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private staffService: StaffService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadMyLeaves();
  }

  loadCurrentUser(): void {
    const currentUser = this.authService.userValue;
    if (currentUser?.email) {
      this.loadingProfile = true;
      this.staffService.getStaffByEmail(currentUser.email).pipe(
        finalize(() => this.loadingProfile = false),
        catchError(err => {
          console.error("Error loading staff profile:", err);
          return of(null);
        })
      ).subscribe(staff => {
        if (staff) {
          this.staffId = staff.staffId;
          this.currentUserName = staff.staffName || '';
          this.loadMyLeaves();
        }
      });
    }
  }

  loadMyLeaves(): void {
    if (this.staffId === null) return;
    this.loading = true;
    this.leaveService.getStaffLeaves(this.staffId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.allLeaves = data;
          this.applyFilters();
        },
        error: (err) => {
          console.error('Error loading my leaves:', err);
          Swal.fire('Error', 'Failed to load your leave history', 'error');
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.allLeaves];

    // Status filter
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(leave => {
        const s = leave.status.toString();
        return s === this.statusFilter || s === LeaveStatus[this.statusFilter as any];
      });
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(leave => {
        const typeName = this.getLeaveTypeName(leave.leaveType).toLowerCase();
        return typeName.includes(query) || leave.reason.toLowerCase().includes(query);
      });
    }

    // Apply sorting
    filtered.sort((a: any, b: any) => {
      let aValue = a[this.sortColumn];
      let bValue = b[this.sortColumn];

      if (this.sortColumn === 'appliedDate' || this.sortColumn === 'startDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredLeaves = filtered;
    this.currentPage = 1;
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  getLeaveTypeName(type: any): string {
    if (type === null || type === undefined) return 'Other';
    if (typeof type === 'string') {
      if (!isNaN(Number(type))) return LeaveType[Number(type)] || type;
      return type;
    }
    return LeaveType[type] || 'Other';
  }

  getLeaveStatusName(status: any): string {
    if (status === null || status === undefined) return 'Unknown';
    if (typeof status === 'string') {
      if (!isNaN(Number(status))) return LeaveStatus[Number(status)] || status;
      return status;
    }
    return LeaveStatus[status] || 'Unknown';
  }

  getStatusClass(status: any): string {
    const s = this.normalizeStatus(status);
    switch (s) {
      case LeaveStatus.Approved: return 'bg-success-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case LeaveStatus.Pending: return 'bg-warning-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case LeaveStatus.Rejected: return 'bg-danger-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      default: return 'bg-neutral-200 text-neutral-900 px-24 py-4 radius-4 fw-medium text-sm';
    }
  }

  getStatusIcon(status: any): string {
    const s = this.normalizeStatus(status);
    switch (s) {
      case LeaveStatus.Approved: return 'solar:check-circle-bold';
      case LeaveStatus.Pending: return 'solar:clock-circle-bold';
      case LeaveStatus.Rejected: return 'solar:close-circle-bold';
      default: return 'solar:question-circle-bold';
    }
  }

  checkStatus(status: any, target: string | LeaveStatus): boolean {
    if (status === null || status === undefined) return false;
    const s = this.normalizeStatus(status);
    if (typeof target === 'string') {
      const targetEnum = LeaveStatus[target as keyof typeof LeaveStatus];
      return s === targetEnum || (status as any) === target;
    }
    return s === target;
  }

  private normalizeStatus(status: any): LeaveStatus {
    if (status === null || status === undefined) return -1 as any;
    if (typeof status === 'number') return status;
    const sStr = status.toString();
    if (sStr === 'Pending' || sStr === '0') return LeaveStatus.Pending;
    if (sStr === 'Approved' || sStr === '1') return LeaveStatus.Approved;
    if (sStr === 'Rejected' || sStr === '2') return LeaveStatus.Rejected;
    if (sStr === 'Cancelled' || sStr === '3') return LeaveStatus.Cancelled;
    if (!isNaN(Number(sStr))) return Number(sStr);
    return -1 as any;
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

  getpendingLeaves(): number {
    return this.allLeaves.filter(l => this.normalizeStatus(l.status) === LeaveStatus.Pending).length;
  }

  getapprovedLeaves(): number {
    return this.allLeaves.filter(l => this.normalizeStatus(l.status) === LeaveStatus.Approved).length;
  }

  getrejectedLeaves(): number {
    return this.allLeaves.filter(l => this.normalizeStatus(l.status) === LeaveStatus.Rejected).length;
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
