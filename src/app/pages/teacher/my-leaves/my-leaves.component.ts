import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { LeaveService } from '../../../services/leave.service';
import { Leave, LeaveStatus, LeaveType } from '../../../Models/leave';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

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
  staffId = 1;
  currentUserName = 'Ali Hassan';

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

  constructor(private leaveService: LeaveService) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadMyLeaves();
  }

  loadCurrentUser(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      this.staffId = user.staffId || 1;
      this.currentUserName = user.name || 'Ali Hassan';
    }
  }

  loadMyLeaves(): void {
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
      const statusValue = LeaveStatus[this.statusFilter as keyof typeof LeaveStatus];
      filtered = filtered.filter(leave => leave.status === statusValue);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(leave =>
        LeaveType[leave.leaveType].toLowerCase().includes(query) ||
        leave.reason.toLowerCase().includes(query)
      );
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

  getStatusIcon(status: number): string {
    switch (status) {
      case LeaveStatus.Approved: return 'solar:check-circle-bold';
      case LeaveStatus.Pending: return 'solar:clock-circle-bold';
      case LeaveStatus.Rejected: return 'solar:close-circle-bold';
      default: return 'solar:question-circle-bold';
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
