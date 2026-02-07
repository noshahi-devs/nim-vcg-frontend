import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';
import { LeaveTypeMaster, LeaveTypeService } from '../../../services/leave-type.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-leave-type',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './leave-type.component.html',
  styleUrl: './leave-type.component.css'
})
export class LeaveTypeComponent implements OnInit {
  title = 'Leave Type Management';
  Math = Math;

  // Leave types
  leaveTypes: LeaveTypeMaster[] = [];
  filteredTypes: LeaveTypeMaster[] = [];
  loading = false;

  // Modal
  showModal = false;
  isEditMode = false;
  leaveTypeForm: LeaveTypeMaster = this.getEmptyForm();

  // Pagination
  rowsPerPage = 10;
  currentPage = 1;

  constructor(private leaveTypeService: LeaveTypeService) { }

  ngOnInit(): void {
    this.loadLeaveTypes();
  }

  getEmptyForm(): LeaveTypeMaster {
    return {
      leaveTypeMasterId: 0,
      leaveTypeName: '',
      description: '',
      maxDaysAllowed: 0,
      isPaid: true,
      isActive: true
    };
  }

  loadLeaveTypes(): void {
    this.loading = true;
    this.leaveTypeService.getLeaveTypes()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.leaveTypes = data;
          this.filteredTypes = [...this.leaveTypes];
        },
        error: (err) => {
          console.error('Error loading leave types:', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load leave types.' });
        }
      });
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.leaveTypeForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(type: LeaveTypeMaster): void {
    this.isEditMode = true;
    this.leaveTypeForm = { ...type };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.leaveTypeForm = this.getEmptyForm();
  }

  validateForm(): boolean {
    if (!this.leaveTypeForm.leaveTypeName.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please enter leave type name.', confirmButtonColor: '#800020' });
      return false;
    }
    if (this.leaveTypeForm.maxDaysAllowed <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Input', text: 'Maximum days must be greater than 0.', confirmButtonColor: '#800020' });
      return false;
    }
    return true;
  }

  saveLeaveType(): void {
    if (!this.validateForm()) return;

    if (this.isEditMode) {
      this.leaveTypeService.updateLeaveType(this.leaveTypeForm.leaveTypeMasterId, this.leaveTypeForm).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Updated!', text: 'Leave type updated successfully.', timer: 2000, showConfirmButton: false });
          this.loadLeaveTypes();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error updating leave type:', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update leave type.' });
        }
      });
    } else {
      this.leaveTypeService.createLeaveType(this.leaveTypeForm).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Added!', text: 'Leave type added successfully.', timer: 2000, showConfirmButton: false });
          this.loadLeaveTypes();
          this.closeModal();
        },
        error: (err) => {
          console.error('Error creating leave type:', err);
          Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create leave type.' });
        }
      });
    }
  }

  confirmDelete(type: LeaveTypeMaster): void {
    Swal.fire({
      title: 'Are you sure?',
      html: `Do you want to delete <strong>${type.leaveTypeName}</strong>?<br><small class="text-secondary-light">This action cannot be undone.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.leaveTypeService.deleteLeaveType(type.leaveTypeMasterId).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Leave type deleted.', timer: 2000, showConfirmButton: false });
            this.loadLeaveTypes();
          },
          error: (err) => {
            console.error('Error deleting leave type:', err);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete leave type.' });
          }
        });
      }
    });
  }

  toggleStatus(type: LeaveTypeMaster): void {
    // Optimistic update
    const previousStatus = type.isActive;
    type.isActive = !type.isActive;

    this.leaveTypeService.updateLeaveType(type.leaveTypeMasterId, type).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Status Updated!', text: `Leave type is now ${type.isActive ? 'Active' : 'Inactive'}.`, timer: 1500, showConfirmButton: false });
      },
      error: (err) => {
        type.isActive = previousStatus; // Revert
        console.error('Error updating status:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update status.' });
      }
    });
  }

  getStatusClass(status: boolean): string {
    return status ? 'bg-success-600 text-white px-24 py-4 radius-4 fw-medium text-sm' : 'bg-danger-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
  }

  get totalTypes(): number { return this.leaveTypes.length; }
  get activeTypes(): number { return this.leaveTypes.filter(t => t.isActive).length; }
  get inactiveTypes(): number { return this.leaveTypes.filter(t => !t.isActive).length; }

  get paginatedTypes(): LeaveTypeMaster[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredTypes.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number { return Math.ceil(this.filteredTypes.length / this.rowsPerPage); }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}
