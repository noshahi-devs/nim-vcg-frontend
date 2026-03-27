import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffService } from '../../../services/staff.service';
import { Designation } from '../../../Models/staff';
import { finalize } from 'rxjs';
import { AuthService } from '../../../SecurityModels/auth.service';
import Swal from '../../../swal';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './staff-list.component.html',
  styleUrls: ['./staff-list.component.css']
})
export class StaffListComponent implements OnInit, AfterViewInit {
  title = 'Staff List';
  searchTerm: string = '';
  staffList: any[] = [];
  loading = false;
  defaultImage = 'assets/images/user-grid/user-grid-img2.png';
  Math = Math;

  // Pagination
  currentPage = 1;
  rowsPerPage = 12;

  // Premium Modal State
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;

  apiBaseUrl = environment.apiBaseUrl;

  getImage(imagePath: string | undefined): string {
    if (!imagePath) return this.defaultImage;
    if (imagePath.startsWith('http') || imagePath.startsWith('data:') || imagePath.startsWith('assets/')) return imagePath;
    const normalizedPath = imagePath.replace(/\\/g, '/').replace(/^\//, '');
    return `${this.apiBaseUrl}/${normalizedPath}`;
  }

  // For Deletion Confirmation
  showDeleteModal = false;
  staffToDelete: any = null;
  selectedStaff: any = null;
  showViewModal = false;

  get totalStaff(): number { return this.staffList.length; }
  get teacherCount(): number {
    return this.staffList.filter(s => {
      const d = s.designation?.toString().toLowerCase();
      return d === 'teacher' || s.designation === 0;
    }).length;
  }
  get departmentsCount(): number { return new Set(this.staffList.map(s => s.department?.departmentName || 'N/A')).size; }

  constructor(
    private staffService: StaffService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadStaff();
  }

  loadStaff(): void {
    this.loading = true;
    this.staffService
      .getAllStaffs()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.staffList = res || [];
          this.currentPage = 1;
        },
        error: (err) => {
          console.error('Error fetching staff:', err);
        }
      });
  }

  // Open premium confirmation delete modal
  confirmDelete(staff: any): void {
    this.staffToDelete = staff;
    this.showDeleteModal = true;
  }

  // Cancel delete modal
  cancelDelete(): void {
    this.staffToDelete = null;
    this.showDeleteModal = false;
  }

  // Open view modal
  openViewModal(staff: any): void {
    this.selectedStaff = { ...staff };
    this.showViewModal = true;
  }

  // Execute deletion
  deleteStaff(): void {
    if (!this.staffToDelete) return;
    const id = this.staffToDelete.staffId;

    this.isProcessing = true;
    this.staffService.deleteStaff(id).subscribe({
      next: () => {
        this.isProcessing = false;
        this.staffList = this.staffList.filter(s => s.staffId !== id);
        this.staffToDelete = null;
        this.showDeleteModal = false;
        this.showFeedback('success', 'Deleted!', 'Staff member has been deleted permanently.');
      },
      error: (err) => {
        this.isProcessing = false;
        console.error('Delete failed:', err);
        this.showDeleteModal = false;
        const errorMsg = err.error?.message || 'Failed to delete staff member. They may have linked records (Sections, Assignments, or Leaves).';
        this.showFeedback('error', 'Cannot Delete Staff', errorMsg);
        this.staffToDelete = null;
      }
    });
  }

  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  closeFeedback() {
    this.showFeedbackModal = false;
  }

  // ✅ Filter for search
  get filteredStaffList() {
    if (!this.searchTerm) return this.staffList;
    const search = this.searchTerm.toLowerCase();
    return this.staffList.filter(staff =>
      staff.staffName?.toLowerCase().includes(search) ||
      staff.email?.toLowerCase().includes(search) ||
      staff.department?.departmentName?.toLowerCase().includes(search) ||
      staff.contactNumber1?.includes(search)
    );
  }

  get paginatedStaffList() {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredStaffList.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStaffList.length / this.rowsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  getDesignationName(designation: any): string {
    if (designation === null || designation === undefined) return 'N/A';
    if (typeof designation === 'number') {
      return Designation[designation] || 'N/A';
    }
    return designation;
  }

  ngAfterViewInit() { }
}
