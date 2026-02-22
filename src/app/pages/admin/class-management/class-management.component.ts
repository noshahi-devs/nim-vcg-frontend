import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, RouterLink],
  templateUrl: './class-management.component.html',
  styleUrls: ['./class-management.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClassManagementComponent implements OnInit {
  title = 'Class Management';

  // Data
  classes: Standard[] = [];
  sections: Section[] = [];
  filteredClasses: Standard[] = [];
  paginatedClasses: Standard[] = [];

  // State
  searchTerm = '';
  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  loading = false;

  // View dialog
  selectedClass: Standard | null = null;
  showViewDialog = false;

  Math = Math;

  constructor(
    private router: Router,
    private standardService: StandardService,
    private sectionService: SectionService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.standardService.getStandards()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.classes = data || [];
          this.applyFilter();
        },
        error: () => Swal.fire('Error', 'Failed to load class data', 'error')
      });

    this.sectionService.getSections().subscribe({
      next: (data) => this.sections = data || [],
      error: (err) => console.error('Error loading sections', err)
    });
  }

  getSectionsForClass(std: Standard): Section[] {
    return this.sections.filter(s => s.className === std.standardName);
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase().trim();
    this.filteredClasses = term
      ? this.classes.filter(c =>
        c.standardName?.toLowerCase().includes(term) ||
        c.standardCode?.toLowerCase().includes(term) ||
        c.classTeacher?.toLowerCase().includes(term)
      )
      : [...this.classes];
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredClasses.length / this.rowsPerPage) || 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedClasses = this.filteredClasses.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  openViewDialog(cls: Standard) {
    this.selectedClass = cls;
    this.showViewDialog = true;
  }

  closeDialog() {
    this.showViewDialog = false;
    this.selectedClass = null;
  }

  editClass(cls: Standard) {
    this.router.navigate(['/class-edit', cls.standardId]);
  }

  deleteClass(cls: Standard) {
    Swal.fire({
      title: 'Delete Class?',
      text: `Are you sure you want to delete "${cls.standardName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#d33',
      cancelButtonText: 'Cancel'
    }).then(result => {
      if (result.isConfirmed) {
        this.standardService.deleteStandard(cls.standardId).subscribe({
          next: () => {
            Swal.fire({ icon: 'success', title: 'Deleted!', timer: 1500, showConfirmButton: false });
            this.loadData();
          },
          error: (err) => {
            const msg = typeof err.error === 'string' ? err.error : 'Unable to delete class. It may have associated students or subjects.';
            Swal.fire({ icon: 'error', title: 'Cannot Delete', text: msg });
          }
        });
      }
    });
  }

  get totalStudents(): number {
    return this.classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
  }

  get totalSubjects(): number {
    return this.classes.reduce((sum, c) => sum + (c.subjects?.length || 0), 0);
  }

  get totalSections(): number {
    return this.sections.length;
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
