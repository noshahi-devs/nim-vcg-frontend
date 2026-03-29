import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { LeaveTypeMaster, LeaveTypeService } from '../../../services/leave-type.service';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

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

  leaveTypes: LeaveTypeMaster[] = [];
  filteredTypes: LeaveTypeMaster[] = [];
  loading = false;

  showModal = false;
  isEditMode = false;
  leaveTypeForm: LeaveTypeMaster = this.getEmptyForm();

  rowsPerPage = 10;
  currentPage = 1;
  isProcessing = false;

  constructor(
    private leaveTypeService: LeaveTypeService,
    private popup: PopupService
  ) { }

  ngOnInit(): void { this.loadLeaveTypes(); }

  getEmptyForm(): LeaveTypeMaster {
    return { leaveTypeMasterId: 0, leaveTypeName: '', description: '', maxDaysAllowed: 0, isPaid: true, isActive: true };
  }

  // Modals are now handled by PopupService

  loadLeaveTypes(): void {
    this.loading = true;
    this.leaveTypeService.getLeaveTypes()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => { this.leaveTypes = data; this.filteredTypes = [...this.leaveTypes]; },
        error: (err) => {
          console.error('Error loading leave types:', err);
          this.popup.error('Error', 'Failed to load leave types.');
        }
      });
  }

  openAddModal(): void { this.isEditMode = false; this.leaveTypeForm = this.getEmptyForm(); this.showModal = true; }
  openEditModal(type: LeaveTypeMaster): void { this.isEditMode = true; this.leaveTypeForm = { ...type }; this.showModal = true; }

  closeModal(): void { this.showModal = false; this.leaveTypeForm = this.getEmptyForm(); }

  validateForm(): boolean {
    if (!this.leaveTypeForm.leaveTypeName.trim()) {
      this.popup.warning('Missing Information', 'Please enter leave type name.'); return false;
    }
    if (this.leaveTypeForm.maxDaysAllowed <= 0) {
      this.popup.warning('Invalid Input', 'Maximum days must be greater than 0.'); return false;
    }
    return true;
  }

  saveLeaveType(): void {
    if (!this.validateForm()) return;
    const payload = { ...this.leaveTypeForm };
    this.isProcessing = true;
    this.popup.loading(this.isEditMode ? 'Updating leave type...' : 'Saving leave type...');
    this.closeModal();

    if (this.isEditMode) {
      this.leaveTypeService.updateLeaveType(payload.leaveTypeMasterId, payload)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => { 
            this.popup.success('Updated!', 'Leave type updated successfully.'); 
            this.loadLeaveTypes(); 
          },
          error: (err) => { 
            console.error('Error updating leave type:', err); 
            this.popup.error('Error', 'Failed to update leave type.'); 
          }
        });
    } else {
      this.leaveTypeService.createLeaveType(payload)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => { 
            this.popup.success('Saved!', 'Leave type added successfully.'); 
            this.loadLeaveTypes(); 
          },
          error: (err) => { 
            console.error('Error creating leave type:', err); 
            this.popup.error('Error', 'Failed to create leave type.'); 
          }
        });
    }
  }

  confirmDelete(type: LeaveTypeMaster): void {
    this.popup.confirm('Delete Leave Type?', `Are you sure you want to delete "${type.leaveTypeName}"?`).then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting leave type...');
        this.leaveTypeService.deleteLeaveType(type.leaveTypeMasterId)
          .subscribe({
            next: () => {
              this.popup.deleted('Leave type');
              this.loadLeaveTypes();
            },
            error: (err) => {
              console.error('Error deleting leave type:', err);
              this.popup.error('Error', 'Failed to delete leave type.');
            }
          });
      }
    });
  }

  toggleStatus(type: LeaveTypeMaster): void {
    const previousStatus = type.isActive;
    type.isActive = !type.isActive;
    this.leaveTypeService.updateLeaveType(type.leaveTypeMasterId, type).subscribe({
      next: () => { this.popup.success('Status Updated!', `Leave type is now ${type.isActive ? 'Active' : 'Inactive'}.`); },
      error: (err) => { type.isActive = previousStatus; console.error('Error updating status:', err); this.popup.error('Error', 'Failed to update status.'); }
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
