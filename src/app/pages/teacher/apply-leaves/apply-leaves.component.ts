import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';

interface LeaveType {
  id: number;
  name: string;
  maxDays: number;
  status: boolean;
}

interface LeaveApplication {
  id: number;
  employeeName: string;
  designation: string;
  leaveType: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  reason: string;
  status: string;
  appliedOn: string;
  remarks?: string;
}

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
  employeeName = 'Ali Hassan'; // Auto-filled from logged-in user
  designation = 'Teacher'; // Auto-filled from logged-in user
  leaveType = '';
  fromDate = '';
  toDate = '';
  reason = '';

  // Leave types dropdown
  leaveTypes: LeaveType[] = [];

  // Calculated field
  totalDays = 0;

  ngOnInit(): void {
    this.loadLeaveTypes();
    this.loadEmployeeInfo();
  }

  loadLeaveTypes(): void {
    const savedTypes = localStorage.getItem('leaveTypes');
    if (savedTypes) {
      this.leaveTypes = JSON.parse(savedTypes).filter((type: LeaveType) => type.status);
    } else {
      // Default leave types
      this.leaveTypes = [
        { id: 1, name: 'Sick Leave', maxDays: 10, status: true },
        { id: 2, name: 'Casual Leave', maxDays: 15, status: true },
        { id: 3, name: 'Annual Leave', maxDays: 30, status: true },
        { id: 4, name: 'Maternity Leave', maxDays: 90, status: true },
        { id: 5, name: 'Emergency Leave', maxDays: 5, status: true }
      ];
      localStorage.setItem('leaveTypes', JSON.stringify(this.leaveTypes));
    }
  }

  loadEmployeeInfo(): void {
    // In a real application, this would load from authentication service
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
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
    // Check required fields
    if (!this.leaveType) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select a leave type.',
        confirmButtonColor: '#800020'
      });
      return false;
    }

    if (!this.fromDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select from date.',
        confirmButtonColor: '#800020'
      });
      return false;
    }

    if (!this.toDate) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please select to date.',
        confirmButtonColor: '#800020'
      });
      return false;
    }

    if (!this.reason.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please provide a reason for leave.',
        confirmButtonColor: '#800020'
      });
      return false;
    }

    // Date validation
    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);

    if (to < from) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Dates',
        text: 'To date cannot be before from date.',
        confirmButtonColor: '#800020'
      });
      return false;
    }

    // Check if from date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    from.setHours(0, 0, 0, 0);

    if (from < today) {
      Swal.fire({
        icon: 'warning',
        title: 'Past Date',
        text: 'Leave start date cannot be in the past.',
        confirmButtonColor: '#800020'
      });
      return false;
    }

    // Check max days for selected leave type
    const selectedType = this.leaveTypes.find(lt => lt.name === this.leaveType);
    if (selectedType && this.totalDays > selectedType.maxDays) {
      Swal.fire({
        icon: 'warning',
        title: 'Exceeds Maximum',
        text: `${this.leaveType} allows maximum ${selectedType.maxDays} days. You requested ${this.totalDays} days.`,
        confirmButtonColor: '#800020'
      });
      return false;
    }

    return true;
  }

  submitLeave(): void {
    // Validate form
    if (!this.validateForm()) {
      return;
    }

    // Create leave application object
    const newLeave: LeaveApplication = {
      id: Date.now(),
      employeeName: this.employeeName,
      designation: this.designation,
      leaveType: this.leaveType,
      fromDate: this.fromDate,
      toDate: this.toDate,
      totalDays: this.totalDays,
      reason: this.reason,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };

    // Save to localStorage
    const savedLeaves = localStorage.getItem('leaveApplications');
    let leaveApplications: LeaveApplication[] = savedLeaves ? JSON.parse(savedLeaves) : [];
    leaveApplications.unshift(newLeave);
    localStorage.setItem('leaveApplications', JSON.stringify(leaveApplications));

    // Show success message
    Swal.fire({
      icon: 'success',
      title: 'Leave Applied Successfully!',
      html: `
        <div class="text-start">
          <p><strong>Leave Type:</strong> ${this.leaveType}</p>
          <p><strong>Duration:</strong> ${this.fromDate} to ${this.toDate}</p>
          <p><strong>Total Days:</strong> ${this.totalDays}</p>
          <p><strong>Status:</strong> <span class="badge bg-warning">Pending</span></p>
        </div>
      `,
      confirmButtonColor: '#800020',
      timer: 3000
    });

    // Reset form
    this.resetForm();
  }

  resetForm(): void {
    this.leaveType = '';
    this.fromDate = '';
    this.toDate = '';
    this.reason = '';
    this.totalDays = 0;
  }
}
