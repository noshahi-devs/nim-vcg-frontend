import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { LeaveService } from '../../../services/leave.service';
import { Leave, LeaveStatus, LeaveType } from '../../../Models/leave';
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

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' | 'info' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  // Detail Modal
  showDetailModal = false;
  selectedLeave: Leave | null = null;

  constructor(private leaveService: LeaveService) { }

  ngOnInit(): void {
    this.loadLeaveData();
  }

  // ── Helpers ──
  triggerSuccess(title: string, message: string) {
    this.feedbackType = 'success'; this.feedbackTitle = title; this.feedbackMessage = message; this.showFeedbackModal = true;
  }
  triggerError(title: string, message: string) {
    this.feedbackType = 'error'; this.feedbackTitle = title; this.feedbackMessage = message; this.showFeedbackModal = true;
  }
  triggerInfo(title: string, message: string) {
    this.feedbackType = 'info'; this.feedbackTitle = title; this.feedbackMessage = message; this.showFeedbackModal = true;
  }
  closeFeedback() { this.showFeedbackModal = false; }

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
          this.triggerError('Error', 'Failed to load leave data');
        }
      });
  }

  calculateStats(): void {
    this.totalLeavesCount = this.recentApplications.length;
    this.pendingLeavesCount = this.recentApplications.filter(l => l.status === LeaveStatus.Pending).length;
    this.approvedLeavesCount = this.recentApplications.filter(l => l.status === LeaveStatus.Approved).length;
    this.rejectedLeavesCount = this.recentApplications.filter(l => l.status === LeaveStatus.Rejected).length;
  }

  getLeaveTypeName(type: number): string { return LeaveType[type]; }
  getLeaveStatusName(status: number): string { return LeaveStatus[status]; }

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
    this.triggerSuccess('Refreshed!', 'Data refreshed successfully.');
  }

  exportData(): void {
    this.triggerInfo('Export', 'Export functionality will be implemented soon.');
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
