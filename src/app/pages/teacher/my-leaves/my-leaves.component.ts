import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

interface LeaveApplication {
  id: number;
  employeeName: string;
  designation: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedOn: string;
  remarks?: string;
}

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
  currentUserName = 'Ali Hassan';

  // All leaves
  allLeaves: LeaveApplication[] = [];
  filteredLeaves: LeaveApplication[] = [];

  // Filters
  statusFilter = 'All';
  searchQuery = '';

  // Pagination
  rowsPerPage = 10;
  currentPage = 1;

  // Sorting
  sortColumn = 'appliedOn';
  sortDirection: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadMyLeaves();
  }

  loadCurrentUser(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      this.currentUserName = user.name || 'Ali Hassan';
    }
  }

  loadMyLeaves(): void {
    const savedLeaves = localStorage.getItem('leaveApplications');
    if (savedLeaves) {
      const allApplications: LeaveApplication[] = JSON.parse(savedLeaves);
      // Filter only current user's leaves
      this.allLeaves = allApplications.filter(leave => leave.employeeName === this.currentUserName);
    } else {
      this.allLeaves = [];
    }
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allLeaves];

    // Status filter
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(leave => leave.status === this.statusFilter);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(leave =>
        leave.leaveType.toLowerCase().includes(query) ||
        leave.reason.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[this.sortColumn as keyof LeaveApplication];
      let bValue: any = b[this.sortColumn as keyof LeaveApplication];

      if (this.sortColumn === 'appliedOn' || this.sortColumn === 'fromDate') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredLeaves = filtered;
    this.currentPage = 1; // Reset to first page
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

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case 'Pending': return 'bg-warning-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case 'Rejected': return 'bg-danger-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      default: return 'bg-neutral-200 text-neutral-900 px-24 py-4 radius-4 fw-medium text-sm';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'Approved': return 'solar:check-circle-bold';
      case 'Pending': return 'solar:clock-circle-bold';
      case 'Rejected': return 'solar:close-circle-bold';
      default: return 'solar:question-circle-bold';
    }
  }

  // Statistics
  get totalLeaves(): number {
    return this.allLeaves.length;
  }

  get pendingLeaves(): number {
    return this.allLeaves.filter(l => l.status === 'Pending').length;
  }

  get approvedLeaves(): number {
    return this.allLeaves.filter(l => l.status === 'Approved').length;
  }

  get rejectedLeaves(): number {
    return this.allLeaves.filter(l => l.status === 'Rejected').length;
  }

  // Pagination
  get paginatedLeaves(): LeaveApplication[] {
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
