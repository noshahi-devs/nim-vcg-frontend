import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SectionService } from '../../../services/section.service';
import { StandardService } from '../../../services/standard.service';
import { Section } from '../../../Models/section';
import { Standard } from '../../../Models/standard';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SubjectAssignmentService } from '../../../core/services/subject-assignment.service';
import { PopupService } from '../../../services/popup.service';
import { forkJoin, finalize } from 'rxjs';

@Component({
  selector: 'app-section-list',
  standalone: true,
  imports: [BreadcrumbComponent, FormsModule, RouterLink, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './section-list.component.html',
  styleUrls: ['./section-list.component.css']
})
export class SectionListComponent implements OnInit {
  title = 'Section List';
  searchTerm = '';
  loading = false;
  selectedSection: Section | null = null;
  editLoading = false;
  allStaff: any[] = [];
  Math = Math;

  // Pagination
  currentPage = 1;
  rowsPerPage = 12;

  // Premium Modal Visibility State
  showViewModal = false;
  showEditModal = false;
  // Local popup state removed

  sectionList: Section[] = [];
  classes: Standard[] = [];

  get totalSections(): number { return this.sectionList.length; }
  get totalCapacity(): number { return this.sectionList.reduce((acc, curr) => acc + (curr.capacity || 0), 0); }
  get assignedTeachersCount(): number { return new Set(this.sectionList.filter(s => s.staffId).map(s => s.staffId)).size; }

  constructor(
    private sectionService: SectionService,
    private standardService: StandardService,
    private authService: AuthService,
    private staffService: StaffService,
    private assignmentService: SubjectAssignmentService,
    private popup: PopupService
  ) { }

  get filteredSectionList() {
    let list = this.sectionList;
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(s =>
        s.sectionName?.toLowerCase().includes(search) ||
        s.classTeacher?.staffName?.toLowerCase().includes(search) ||
        s.roomNo?.toLowerCase().includes(search)
      );
    }
    return list;
  }

  get paginatedSectionList() {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredSectionList.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSectionList.length / this.rowsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  ngOnInit(): void {
    this.loadSections();
    this.loadClasses();
    this.loadStaff();
  }

  // Local feedback mechanism removed

  loadStaff(): void {
    this.staffService.getAllStaffs().subscribe({
      next: (res) => this.allStaff = res,
      error: () => console.error('Failed to load staff')
    });
  }

  loadSections(): void {
    this.loading = true;
    const isTeacher = this.authService.hasAnyRole(['Teacher']);
    const currentUser = this.authService.userValue;

    if (isTeacher && currentUser?.email) {
      this.staffService.getAllStaffs().subscribe({
        next: (staffs) => {
          const staff = staffs.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
          if (staff) { this.fetchAndFilterSections(staff.staffId); }
          else { this.fetchAllSectionsRaw(); }
        },
        error: () => this.fetchAllSectionsRaw()
      });
    } else {
      this.fetchAllSectionsRaw();
    }
  }

  private fetchAllSectionsRaw(): void {
    this.sectionService.getSections().subscribe({
      next: (data) => { this.sectionList = data || []; this.loading = false; this.currentPage = 1; },
      error: (err) => { console.error('Error loading sections:', err); this.loading = false; }
    });
  }

  private fetchAndFilterSections(staffId: number): void {
    forkJoin({
      sections: this.sectionService.getSections(),
      assignments: this.assignmentService.getAssignmentsByTeacher(staffId)
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => {
        const classTeacherSections = res.sections.filter(s => s.staffId === staffId);
        const assignedSectionIds = res.assignments.map(a => a.sectionId);
        const subjectSections = res.sections.filter(s => assignedSectionIds.includes(s.sectionId));
        const uniqueSections = new Map<number, Section>();
        classTeacherSections.forEach(s => uniqueSections.set(s.sectionId, s));
        subjectSections.forEach(s => uniqueSections.set(s.sectionId, s));
        this.sectionList = Array.from(uniqueSections.values());
      },
      error: (err) => console.error('Error loading filtered sections:', err)
    });
  }

  loadClasses(): void {
    this.standardService.getStandards().subscribe({
      next: (data) => { this.classes = data || []; },
      error: (err) => console.error('Error loading classes:', err)
    });
  }



  // ── Delete ──
  confirmDelete(sectionItem: Section) {
    this.popup.confirm('Delete Section', `Are you sure you want to permanently delete section <strong>${sectionItem.sectionName}</strong>? This action cannot be undone.`).then(confirmed => {
      if (confirmed) {
        this.executeDelete(sectionItem);
      }
    });
  }

  executeDelete(section: Section) {
    this.popup.loading('Deleting...');
    this.sectionService.deleteSection(section.sectionId).subscribe({
      next: () => {
        this.popup.closeLoading();
        this.sectionList = this.sectionList.filter(s => s.sectionId !== section.sectionId);
        this.popup.success('Deleted!', `Section "${section.sectionName}" has been permanently deleted.`);
      },
      error: (err) => {
        console.error('Error deleting section:', err);
        this.popup.closeLoading();
        this.popup.deleteError(section.sectionName, err.error?.message);
      }
    });
  }

  // ── View / Edit ──
  openViewModal(section: Section): void {
    this.selectedSection = { ...section };
    this.showViewModal = true;
  }

  openEditModal(section: Section): void {
    this.selectedSection = { ...section };
    this.showEditModal = true;
  }

  // ── Update ──
  updateSection(): void {
    if (!this.selectedSection) return;
    if (!this.selectedSection.sectionName || !this.selectedSection.className) {
      this.popup.warning('Please fill in all required fields (Section Name and Class).', 'Incomplete Form');
      return;
    }
    this.editLoading = true;
    this.popup.loading('Updating section...');
    this.sectionService.updateSection(this.selectedSection.sectionId, this.selectedSection).pipe(
      finalize(() => this.editLoading = false)
    ).subscribe({
      next: () => {
        this.popup.closeLoading();
        this.loadSections();
        this.showEditModal = false;
        this.popup.success('Section Updated!', `Section "${this.selectedSection?.sectionName}" has been updated successfully.`);
      },
      error: () => {
        this.popup.closeLoading();
        this.popup.error('Update Failed', 'Failed to update section. Please try again.');
      }
    });
  }
}


















