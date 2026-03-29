import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { LeaveService } from '../../../services/leave.service';
import { StaffService } from '../../../services/staff.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { Leave, LeaveStatus, LeaveType } from '../../../Models/leave';
import { Designation } from '../../../Models/staff';
import Swal from '../../../swal';
import { finalize, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PopupService } from '../../../services/popup.service';

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
  // Form fields
  staffId: number | null = null;
  employeeName = '';
  designation = '';
  loadingProfile = false;
  leaveTypeStr = '';
  fromDate = '';
  toDate = '';
  reason = '';

  // Leave types dropdown
  leaveTypes = Object.keys(LeaveType).filter(key => isNaN(Number(key)));

  // Calculated field
  totalDays = 0;
  isHalfDay = false;
  submitting = false;

  constructor(
    private leaveService: LeaveService,
    private authService: AuthService,
    private staffService: StaffService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadEmployeeInfo();
  }

  loadEmployeeInfo(): void {
    const currentUser = this.authService.userValue;
    if (currentUser?.email) {
      this.loadingProfile = true;
      this.staffService.getStaffByEmail(currentUser.email).pipe(
        finalize(() => this.loadingProfile = false),
        catchError(err => {
          console.error("Error loading staff profile:", err);
          this.popup.error('Profile Error', 'Could not load your profile data.');
          return of(null);
        })
      ).subscribe(staff => {
        if (staff) {
          this.staffId = staff.staffId;
          this.employeeName = staff.staffName || '';

          if (staff.designation !== undefined && staff.designation !== null) {
            const designationMap: { [key: number]: string } = {
              [Designation.Teacher]: 'Teacher',
              [Designation.Admin]: 'Admin',
              [Designation.Principal]: 'Principal',
              [Designation.Accountant]: 'Accountant'
            };
            this.designation = designationMap[staff.designation as number] || staff.designation.toString();
          }
        }
      });
    }
  }

  onDateChange(): void {
    if (this.isHalfDay && this.fromDate) {
      this.toDate = this.fromDate;
      this.totalDays = 0.5;
      return;
    }
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

  onHalfDayToggle(): void {
    if (this.isHalfDay) {
      this.toDate = this.fromDate;
      this.totalDays = this.fromDate ? 0.5 : 0;
    } else {
      this.onDateChange();
    }
  }

  validateForm(): boolean {
    if (!this.leaveTypeStr) {
      this.popup.warning('Missing Information', 'Please select a leave type.');
      return false;
    }

    if (!this.fromDate) {
      this.popup.warning('Missing Information', 'Please select from date.');
      return false;
    }

    if (!this.toDate) {
      this.popup.warning('Missing Information', 'Please select to date.');
      return false;
    }

    if (!this.reason.trim()) {
      this.popup.warning('Missing Information', 'Please provide a reason for leave.');
      return false;
    }

    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);

    if (to < from) {
      this.popup.error('Invalid Dates', 'To date cannot be before from date.');
      return false;
    }

    return true;
  }

  submitLeave(): void {
    if (!this.validateForm()) return;

    this.submitting = true;
    this.popup.loading('Submitting leave request...');

    const leaveData: Leave = {
      staffId: this.staffId!,
      leaveType: LeaveType[this.leaveTypeStr as keyof typeof LeaveType],
      startDate: this.fromDate,
      endDate: this.toDate,
      reason: this.isHalfDay ? `${this.reason} (Half Day)` : this.reason,
      status: LeaveStatus.Pending
    };

    this.leaveService.createLeave(leaveData)
      .pipe(finalize(() => {
        this.submitting = false;
      }))
      .subscribe({
        next: (resp) => {
          this.popup.success('Leave Applied Successfully!', 'Your leave request has been submitted for approval.');
          this.resetForm();
        },
        error: (err) => {
          console.error('Error submitting leave:', err);
          this.popup.error('Error', 'Failed to submit leave request');
        }
      });
  }

  resetForm(): void {
    this.leaveTypeStr = '';
    this.fromDate = '';
    this.toDate = '';
    this.reason = '';
    this.totalDays = 0;
    this.isHalfDay = false;
  }

  // Modals are now handled by PopupService
}


