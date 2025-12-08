import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

interface LeaveApplication {
  id: number;
  employeeName: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
  appliedOn: string;
}

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
  totalLeaves = 0;
  pendingLeaves = 0;
  approvedLeaves = 0;
  rejectedLeaves = 0;

  // Recent applications
  recentApplications: LeaveApplication[] = [];
  filteredApplications: LeaveApplication[] = [];

  // Pagination
  rowsPerPage = 10;
  currentPage = 1;

  ngOnInit(): void {
    this.loadLeaveData();
    this.calculateStats();
  }

  loadLeaveData(): void {
    const savedLeaves = localStorage.getItem('leaveApplications');
    
    if (savedLeaves) {
      this.recentApplications = JSON.parse(savedLeaves);
    } else {
      this.recentApplications = [
        { id: 1, employeeName: 'Ali Hassan', leaveType: 'Sick Leave', fromDate: '2024-11-15', toDate: '2024-11-17', status: 'Pending', reason: 'Medical checkup', appliedOn: '2024-11-10' },
        { id: 2, employeeName: 'Sara Ahmed', leaveType: 'Casual Leave', fromDate: '2024-11-20', toDate: '2024-11-22', status: 'Approved', reason: 'Family function', appliedOn: '2024-11-08' },
        { id: 3, employeeName: 'Usman Khan', leaveType: 'Annual Leave', fromDate: '2024-11-25', toDate: '2024-11-30', status: 'Pending', reason: 'Personal work', appliedOn: '2024-11-09' },
        { id: 4, employeeName: 'Ayesha Malik', leaveType: 'Sick Leave', fromDate: '2024-11-12', toDate: '2024-11-13', status: 'Rejected', reason: 'Fever', appliedOn: '2024-11-11' },
        { id: 5, employeeName: 'Bilal Raza', leaveType: 'Casual Leave', fromDate: '2024-11-18', toDate: '2024-11-19', status: 'Approved', reason: 'Personal emergency', appliedOn: '2024-11-07' },
        { id: 6, employeeName: 'Fatima Noor', leaveType: 'Annual Leave', fromDate: '2024-12-01', toDate: '2024-12-05', status: 'Pending', reason: 'Vacation', appliedOn: '2024-11-09' },
        { id: 7, employeeName: 'Hamza Tariq', leaveType: 'Sick Leave', fromDate: '2024-11-14', toDate: '2024-11-15', status: 'Approved', reason: 'Doctor appointment', appliedOn: '2024-11-12' }
      ];
      localStorage.setItem('leaveApplications', JSON.stringify(this.recentApplications));
    }

    this.filteredApplications = [...this.recentApplications];
  }

  calculateStats(): void {
    this.totalLeaves = this.recentApplications.length;
    this.pendingLeaves = this.recentApplications.filter(l => l.status === 'Pending').length;
    this.approvedLeaves = this.recentApplications.filter(l => l.status === 'Approved').length;
    this.rejectedLeaves = this.recentApplications.filter(l => l.status === 'Rejected').length;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Approved': return 'bg-success-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case 'Pending': return 'bg-warning-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      case 'Rejected': return 'bg-danger-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
      default: return 'bg-neutral-200 text-neutral-900 px-24 py-4 radius-4 fw-medium text-sm';
    }
  }

  refreshData(): void {
    this.loadLeaveData();
    this.calculateStats();
    Swal.fire({ icon: 'success', title: 'Refreshed!', text: 'Data refreshed successfully.', timer: 1500, showConfirmButton: false });
  }

  exportData(): void {
    Swal.fire({ icon: 'info', title: 'Export', text: 'Export functionality will be implemented soon.', confirmButtonColor: '#800020' });
  }

  viewDetails(leave: LeaveApplication): void {
    Swal.fire({
      title: 'Leave Details',
      html: `<div class="text-start"><p><strong>Employee:</strong> ${leave.employeeName}</p><p><strong>Leave Type:</strong> ${leave.leaveType}</p><p><strong>From:</strong> ${leave.fromDate}</p><p><strong>To:</strong> ${leave.toDate}</p><p><strong>Reason:</strong> ${leave.reason}</p><p><strong>Applied On:</strong> ${leave.appliedOn}</p><p><strong>Status:</strong> <span class="badge ${this.getStatusClass(leave.status)}">${leave.status}</span></p></div>`,
      confirmButtonColor: '#800020'
    });
  }

  get paginatedApplications(): LeaveApplication[] {
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
