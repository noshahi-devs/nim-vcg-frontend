import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';

declare var bootstrap: any;

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
  allLeaves: LeaveApplication[] = [];
  filteredLeaves: LeaveApplication[] = [];

  // Filters
  statusFilter = 'All';
  leaveTypeFilter = 'All';

  // Pagination
  rowsPerPage = 10;
  currentPage = 1;

  // Modal
  showModal = false;
  modalAction: 'approve' | 'reject' = 'approve';
  selectedLeave: LeaveApplication | null = null;
  remarks = '';

  // Leave types for filter
  leaveTypes: string[] = [];

  ngOnInit(): void {
    this.loadAllLeaves();
    this.loadLeaveTypes();
  }

  loadAllLeaves(): void {
    const savedLeaves = localStorage.getItem('leaveApplications');
    if (savedLeaves) {
      this.allLeaves = JSON.parse(savedLeaves);
    } else {
      this.allLeaves = [];
    }
    this.applyFilters();
  }

  loadLeaveTypes(): void {
    const savedTypes = localStorage.getItem('leaveTypes');
    if (savedTypes) {
      const types = JSON.parse(savedTypes);
      this.leaveTypes = types.map((t: any) => t.name);
    } else {
      this.leaveTypes = ['Sick Leave', 'Casual Leave', 'Annual Leave', 'Maternity Leave', 'Emergency Leave'];
    }
  }

  applyFilters(): void {
    let filtered = [...this.allLeaves];

    // Status filter
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter(leave => leave.status === this.statusFilter);
    }

    // Leave type filter
    if (this.leaveTypeFilter !== 'All') {
      filtered = filtered.filter(leave => leave.leaveType === this.leaveTypeFilter);
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

  openApproveModal(leave: LeaveApplication): void {
    this.selectedLeave = leave;
    this.modalAction = 'approve';
    this.remarks = '';
    this.showModal = true;
  }

  openRejectModal(leave: LeaveApplication): void {
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
    if (!this.selectedLeave) return;

    if (!this.remarks.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Remarks Required',
        text: 'Please provide remarks for this action.',
        confirmButtonColor: '#800020'
      });
      return;
    }

    // Update leave status
    const index = this.allLeaves.findIndex(l => l.id === this.selectedLeave!.id);
    if (index !== -1) {
      this.allLeaves[index].status = this.modalAction === 'approve' ? 'Approved' : 'Rejected';
      this.allLeaves[index].remarks = this.remarks;
      
      // Save to localStorage
      localStorage.setItem('leaveApplications', JSON.stringify(this.allLeaves));
      
      // Show success message
      Swal.fire({
        icon: 'success',
        title: `Leave ${this.modalAction === 'approve' ? 'Approved' : 'Rejected'}!`,
        html: `
          <div class="text-start">
            <p><strong>Employee:</strong> ${this.selectedLeave.employeeName}</p>
            <p><strong>Leave Type:</strong> ${this.selectedLeave.leaveType}</p>
            <p><strong>Duration:</strong> ${this.selectedLeave.fromDate} to ${this.selectedLeave.toDate}</p>
            <p><strong>Remarks:</strong> ${this.remarks}</p>
          </div>
        `,
        confirmButtonColor: '#800020',
        timer: 3000
      });
      
      // Refresh data
      this.applyFilters();
    }

    this.closeModal();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case 'Pending': return 'bg-warning-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case 'Rejected': return 'bg-danger-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      default: return 'bg-neutral-200 text-neutral-900 px-24 py-4 radius-4 fw-medium text-sm';
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
