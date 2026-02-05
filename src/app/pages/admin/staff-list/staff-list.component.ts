import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StaffService } from '../../../services/staff.service';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

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

  constructor(private staffService: StaffService) { }

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
        },
        error: (err) => {
          console.error('Error fetching staff:', err);
          // Fallback message could be added here
        }
      });
  }

  confirmDelete(staff: any): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${staff.staffName}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteStaff(staff.staffId);
      }
    });
  }

  deleteStaff(id: number): void {
    this.staffService.deleteStaff(id).subscribe({
      next: () => {
        this.staffList = this.staffList.filter(s => s.staffId !== id);
        Swal.fire('Deleted!', 'Staff member has been deleted.', 'success');
      },
      error: (err) => {
        console.error('Delete failed:', err);
        Swal.fire('Error', 'Failed to delete staff member.', 'error');
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

  ngAfterViewInit() {
    // Legacy jQuery removal if it causes issues, but keeping for now as it doesn't hurt
  }
}
