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

  // Premium delete/feedback modals
  showDeleteModal = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  deleteTarget: Section | null = null;

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
    private assignmentService: SubjectAssignmentService
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

  // ── Premium Feedback ──
  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string, autoClose = false) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
    if (autoClose) setTimeout(() => { this.showFeedbackModal = false; }, 2200);
  }
  closeFeedback() { this.showFeedbackModal = false; }

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
    this.deleteTarget = sectionItem;
    this.showDeleteModal = true;
  }

  cancelDelete() {
    this.deleteTarget = null;
    this.showDeleteModal = false;
  }

  executeDelete() {
    if (!this.deleteTarget) return;
    const section = this.deleteTarget;
    this.showDeleteModal = false;
    this.sectionService.deleteSection(section.sectionId).subscribe({
      next: () => {
        this.sectionList = this.sectionList.filter(s => s.sectionId !== section.sectionId);
        this.deleteTarget = null;
        this.showFeedback('success', 'Deleted!', `Section "${section.sectionName}" has been permanently deleted.`, true);
      },
      error: (err) => {
        console.error('Error deleting section:', err);
        const errorMsg = err.error?.message || 'Failed to delete section. It may have dependent records (Students or Assignments).';
        this.deleteTarget = null;
        this.showFeedback('error', 'Cannot Delete Section', errorMsg);
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
      this.showFeedback('warning', 'Incomplete Form', 'Please fill in all required fields (Section Name and Class).');
      return;
    }
    this.editLoading = true;
    this.sectionService.updateSection(this.selectedSection.sectionId, this.selectedSection).pipe(
      finalize(() => this.editLoading = false)
    ).subscribe({
      next: () => {
        this.loadSections();
        this.showEditModal = false;
        this.showFeedback('success', 'Section Updated!', `Section "${this.selectedSection?.sectionName}" has been updated successfully.`, true);
      },
      error: () => this.showFeedback('error', 'Update Failed', 'Failed to update section. Please try again.')
    });
  }
}
