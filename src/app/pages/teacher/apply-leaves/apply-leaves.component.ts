import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { LeaveService } from '../../../services/leave.service';
import { Leave, LeaveStatus, LeaveType } from '../../../Models/leave';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-apply-leaves',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './apply-leaves.component.html',
  styleUrl: './apply-leaves.component.css'
})
export class ApplyLeavesComponent implements OnInit {
  title = 'Apply Leave';

  // Form fields
  staffId = 1; // Default for demo
  employeeName = 'Ali Hassan';
  designation = 'Teacher';
  leaveTypeStr = '';
  fromDate = '';
  toDate = '';
  reason = '';

  // Leave types dropdown
  leaveTypes = Object.keys(LeaveType).filter(key => isNaN(Number(key)));

  // Calculated field
  totalDays = 0;
  submitting = false;

  constructor(private leaveService: LeaveService) { }

  ngOnInit(): void {
    this.loadEmployeeInfo();
  }

  loadEmployeeInfo(): void {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      this.staffId = user.staffId || 1;
      this.employeeName = user.name || 'Ali Hassan';
      this.designation = user.designation || 'Teacher';
    }
  }

  onDateChange(): void {
    if (this.fromDate && this.toDate) {
      const from = new Date(this.fromDate);
      const to = new Date(this.toDate);

      if (to >= from) {
        const diffTime = Math.abs(to.getTime() - from.getTime());
        this.totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      } else {
        this.totalDays = 0;
      }
    } else {
      this.totalDays = 0;
    }
  }

  validateForm(): boolean {
    if (!this.leaveTypeStr) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please select a leave type.', confirmButtonColor: '#800020' });
      return false;
    }

    if (!this.fromDate) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please select from date.', confirmButtonColor: '#800020' });
      return false;
    }

    if (!this.toDate) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please select to date.', confirmButtonColor: '#800020' });
      return false;
    }

    if (!this.reason.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please provide a reason for leave.', confirmButtonColor: '#800020' });
      return false;
    }

    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);

    if (to < from) {
      Swal.fire({ icon: 'error', title: 'Invalid Dates', text: 'To date cannot be before from date.', confirmButtonColor: '#800020' });
      return false;
    }

    return true;
  }

  submitLeave(): void {
    if (!this.validateForm()) return;

    this.submitting = true;
    const leaveData: Leave = {
      staffId: this.staffId,
      leaveType: LeaveType[this.leaveTypeStr as keyof typeof LeaveType],
      startDate: this.fromDate,
      endDate: this.toDate,
      reason: this.reason,
      status: LeaveStatus.Pending
    };

    this.leaveService.createLeave(leaveData)
      .pipe(finalize(() => this.submitting = false))
      .subscribe({
        next: (resp) => {
          Swal.fire({
            icon: 'success',
            title: 'Leave Applied Successfully!',
            text: 'Your leave request has been submitted for approval.',
            confirmButtonColor: '#800020',
            timer: 3000
          });
          this.resetForm();
        },
        error: (err) => {
          console.error('Error submitting leave:', err);
          Swal.fire('Error', 'Failed to submit leave request', 'error');
        }
      });
  }

  resetForm(): void {
    this.leaveTypeStr = '';
    this.fromDate = '';
    this.toDate = '';
    this.reason = '';
    this.totalDays = 0;
  }
}
