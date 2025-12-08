import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import Swal from 'sweetalert2';

interface LeaveType {
  id: number;
  name: string;
  description: string;
  maxDays: number;
  status: boolean;
}

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
  leaveTypes: LeaveType[] = [];
  filteredTypes: LeaveType[] = [];

  // Modal
  showModal = false;
  isEditMode = false;
  leaveTypeForm: LeaveType = this.getEmptyForm();

  // Pagination
  rowsPerPage = 10;
  currentPage = 1;

  ngOnInit(): void {
    this.loadLeaveTypes();
  }

  getEmptyForm(): LeaveType {
    return {
      id: 0,
      name: '',
      description: '',
      maxDays: 0,
      status: true
    };
  }

  loadLeaveTypes(): void {
    const savedTypes = localStorage.getItem('leaveTypes');
    if (savedTypes) {
      this.leaveTypes = JSON.parse(savedTypes);
    } else {
      this.leaveTypes = [
        { id: 1, name: 'Sick Leave', description: 'Leave for medical reasons', maxDays: 10, status: true },
        { id: 2, name: 'Casual Leave', description: 'Leave for personal matters', maxDays: 15, status: true },
        { id: 3, name: 'Annual Leave', description: 'Yearly vacation leave', maxDays: 30, status: true },
        { id: 4, name: 'Maternity Leave', description: 'Leave for maternity purposes', maxDays: 90, status: true },
        { id: 5, name: 'Emergency Leave', description: 'Leave for emergency situations', maxDays: 5, status: true }
      ];
      this.saveToLocalStorage();
    }
    this.filteredTypes = [...this.leaveTypes];
  }

  saveToLocalStorage(): void {
    localStorage.setItem('leaveTypes', JSON.stringify(this.leaveTypes));
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.leaveTypeForm = this.getEmptyForm();
    this.showModal = true;
  }

  openEditModal(type: LeaveType): void {
    this.isEditMode = true;
    this.leaveTypeForm = { ...type };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.leaveTypeForm = this.getEmptyForm();
  }

  validateForm(): boolean {
    if (!this.leaveTypeForm.name.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please enter leave type name.', confirmButtonColor: '#800020' });
      return false;
    }
    if (!this.leaveTypeForm.description.trim()) {
      Swal.fire({ icon: 'warning', title: 'Missing Information', text: 'Please enter description.', confirmButtonColor: '#800020' });
      return false;
    }
    if (this.leaveTypeForm.maxDays <= 0) {
      Swal.fire({ icon: 'warning', title: 'Invalid Input', text: 'Maximum days must be greater than 0.', confirmButtonColor: '#800020' });
      return false;
    }
    const duplicate = this.leaveTypes.find(t => t.name.toLowerCase() === this.leaveTypeForm.name.toLowerCase() && t.id !== this.leaveTypeForm.id);
    if (duplicate) {
      Swal.fire({ icon: 'error', title: 'Duplicate Entry', text: 'A leave type with this name already exists.', confirmButtonColor: '#800020' });
      return false;
    }
    return true;
  }

  saveLeaveType(): void {
    if (!this.validateForm()) return;

    if (this.isEditMode) {
      const index = this.leaveTypes.findIndex(t => t.id === this.leaveTypeForm.id);
      if (index !== -1) {
        this.leaveTypes[index] = { ...this.leaveTypeForm };
        this.saveToLocalStorage();
        Swal.fire({ icon: 'success', title: 'Updated!', text: 'Leave type updated successfully.', timer: 2000, showConfirmButton: false });
      }
    } else {
      this.leaveTypeForm.id = this.leaveTypes.length > 0 ? Math.max(...this.leaveTypes.map(t => t.id)) + 1 : 1;
      this.leaveTypes.push({ ...this.leaveTypeForm });
      this.saveToLocalStorage();
      Swal.fire({ icon: 'success', title: 'Added!', text: 'Leave type added successfully.', timer: 2000, showConfirmButton: false });
    }

    this.filteredTypes = [...this.leaveTypes];
    this.closeModal();
  }

  confirmDelete(type: LeaveType): void {
    Swal.fire({
      title: 'Are you sure?',
      html: `Do you want to delete <strong>${type.name}</strong>?<br><small class="text-secondary-light">This action cannot be undone.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.leaveTypes = this.leaveTypes.filter(t => t.id !== type.id);
        this.saveToLocalStorage();
        this.filteredTypes = [...this.leaveTypes];
        Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Leave type deleted.', timer: 2000, showConfirmButton: false });
      }
    });
  }

  toggleStatus(type: LeaveType): void {
    const index = this.leaveTypes.findIndex(t => t.id === type.id);
    if (index !== -1) {
      this.leaveTypes[index].status = !this.leaveTypes[index].status;
      this.saveToLocalStorage();
      this.filteredTypes = [...this.leaveTypes];
      Swal.fire({ icon: 'success', title: 'Status Updated!', text: `Leave type is now ${this.leaveTypes[index].status ? 'Active' : 'Inactive'}.`, timer: 1500, showConfirmButton: false });
    }
  }

  getStatusClass(status: boolean): string {
    return status ? 'bg-success-600 text-white px-24 py-4 radius-4 fw-medium text-sm' : 'bg-danger-600 text-white px-24 py-4 radius-4 fw-medium text-sm';
  }

  get totalTypes(): number { return this.leaveTypes.length; }
  get activeTypes(): number { return this.leaveTypes.filter(t => t.status).length; }
  get inactiveTypes(): number { return this.leaveTypes.filter(t => !t.status).length; }

  get paginatedTypes(): LeaveType[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredTypes.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number { return Math.ceil(this.filteredTypes.length / this.rowsPerPage); }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.currentPage = page;
  }
}
