import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffService } from '../../../services/staff.service';
import { Designation } from '../../../Models/staff';
import { finalize } from 'rxjs';
import { AuthService } from '../../../SecurityModels/auth.service';
import { environment } from '../../../../environments/environment';
import { PopupService } from '../../../services/popup.service';

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
  isProcessing = false;

  apiBaseUrl = environment.apiBaseUrl;

  // Real-time stats from server
  stats = { totalStaff: 0, teacherCount: 0, departmentCount: 0 };

  getImage(imagePath: string | undefined): string {
    if (!imagePath) return this.defaultImage;
    if (imagePath.startsWith('http') || imagePath.startsWith('data:') || imagePath.startsWith('assets/')) return imagePath;
    const normalizedPath = imagePath.replace(/\\/g, '/').replace(/^\//, '');
    
    // ⭐ Fix for live server where /images/ is intercepted by frontend
    // Use /api as fallback base to ensure Nginx forwards to backend
    const base = this.apiBaseUrl || '/api';
    return `${base}/${normalizedPath}`;
  }

  selectedStaff: any = null;
  showViewModal = false;

  get totalStaff(): number { return this.staffList.length > 0 ? this.staffList.length : this.stats.totalStaff; }
  get teacherCount(): number {
    if (this.staffList.length > 0) {
      return this.staffList.filter(s => {
        const d = s.designation?.toString().toLowerCase();
        return d === 'teacher' || s.designation === 0;
      }).length;
    }
    return this.stats.teacherCount;
  }
  get departmentsCount(): number {
    if (this.staffList.length > 0) {
      return new Set(this.staffList.map(s => s.department?.departmentName || 'N/A')).size;
    }
    return this.stats.departmentCount;
  }

  constructor(
    private staffService: StaffService,
    public authService: AuthService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadStats();
    this.loadStaff();
  }

  loadStats(): void {
    this.staffService.getStaffStats().subscribe({
      next: (res) => {
        this.stats = res;
      },
      error: (err) => console.error('Error fetching staff stats:', err)
    });
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
    this.popup.confirm(
      'Delete Staff?',
      `Are you sure you want to delete <strong>${staff.staffName}</strong>?`,
      'Yes, Delete',
      'Cancel'
    ).then((confirmed) => {
      if (confirmed) {
        this.deleteStaff(staff);
      }
    });
  }

  // Open view modal
  openViewModal(staff: any): void {
    this.selectedStaff = { ...staff };
    this.showViewModal = true;
  }

  // Execute deletion
  deleteStaff(staffDetails: any): void {
    const id = staffDetails.staffId;

    this.isProcessing = true;
    this.popup.loading('Deleting staff account...');
    this.staffService.deleteStaff(id).subscribe({
      next: () => {
        this.isProcessing = false;
        this.popup.closeLoading();
        this.staffList = this.staffList.filter(s => s.staffId !== id);
        this.popup.deleted('Staff Member');
      },
      error: (err) => {
        this.isProcessing = false;
        this.popup.closeLoading();
        console.error('Delete failed:', err);
        const errorMsg = err.error?.message || 'Could not delete staff. They may have linked classes or subjects.';
        this.popup.deleteError('Staff Member', errorMsg);
      }
    });
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
