import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StudentService } from '../../../services/student.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { AcademicYearService } from '../../../services/academic-year.service';
import { SessionService } from '../../../services/session.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { AcademicYear } from '../../../Models/academic-year';
import { finalize, forkJoin } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-student-promote',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-promote.component.html',
  styleUrls: ['./student-promote.component.css']
})
export class StudentPromoteComponent implements OnInit {
  title = 'Student Promotion';
  Math = Math;

  students: Student[] = []; // Renamed from allStudents to students for consistency with filterStudents
  filteredStudents: Student[] = [];
  selectedStudents: number[] = [];

  classes: Standard[] = [];
  sections: Section[] = [];
  academicYears: AcademicYear[] = [];
  filteredNextSections: Section[] = [];

  searchTerm: string = '';
  selectedClassId: number = 0;
  selectedSectionId: number = 0;

  rowsPerPage: number = 10;
  currentPage: number = 1;

  nextClassId: number = 0;
  nextSectionId: number = 0;
  nextAcademicYearId: number = 0;

  selectedYearId: number | null = null;

  loading = false;



  constructor(
    private router: Router,
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private academicYearService: AcademicYearService,
    private sessionService: SessionService,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.selectedYearId = this.sessionService.getCurrentYearId();
    this.nextAcademicYearId = this.sessionService.getCurrentYearId() || 0;
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    forkJoin({
      students: this.studentService.GetStudents(this.selectedYearId),
      classes: this.standardService.getStandards(),
      sections: this.sectionService.getSections(),
      years: this.academicYearService.getAcademicYears()
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => {
        this.students = res.students || [];
        this.classes = res.classes || [];
        this.sections = res.sections || [];
        this.academicYears = res.years || [];
        this.filterStudents();
      },
      error: (err) => {
        console.error('Error loading data', err);
      }
    });
  }

  onYearChange(): void {
    this.loading = true;
    this.loadInitialData();
  }

  onSourceClassChange(): void {
    this.selectedSectionId = 0; // Reset section when class changes
    this.filterStudents();
  }

  get visibleSourceSections(): Section[] {
    if (!this.selectedClassId) return this.sections;
    const selectedClass = this.classes.find(c => c.standardId === Number(this.selectedClassId));
    if (!selectedClass) return [];
    return this.sections.filter(s => s.className === selectedClass.standardName);
  }

  filterStudents(): void {
    const search = this.searchTerm.toLowerCase().trim();
    
    // Convert to number for strict comparison
    const selClassId = this.selectedClassId ? Number(this.selectedClassId) : 0;
    const selSectionId = this.selectedSectionId ? Number(this.selectedSectionId) : 0;

    this.filteredStudents = this.students.filter(s => {
      const matchSearch = !search ||
        s.studentName?.toLowerCase().includes(search) ||
        s.admissionNo?.toString().includes(search);

      const matchClass = !selClassId || Number(s.standardId) === selClassId;
      
      // Filter by sectionId if available, fallback to section name if sectionId is missing
      const matchSection = !selSectionId || 
        (s.sectionId ? Number(s.sectionId) === selSectionId : 
         s.section === this.sections.find(sec => sec.sectionId === selSectionId)?.sectionName);

      return matchSearch && matchClass && matchSection;
    });
    this.currentPage = 1;
    this.selectedStudents = [];
  }

  get paginatedStudents(): Student[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredStudents.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStudents.length / this.rowsPerPage) || 1;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  toggleSelection(studentId: number): void {
    const index = this.selectedStudents.indexOf(studentId);
    if (index > -1) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(studentId);
    }
  }

  toggleAllSelections(event: any): void {
    const checked = event.target.checked;
    const visibleIds = this.paginatedStudents.map(s => s.studentId);
    this.selectedStudents = checked
      ? Array.from(new Set([...this.selectedStudents, ...visibleIds]))
      : this.selectedStudents.filter(id => !visibleIds.includes(id));
  }

  areAllSelected(): boolean {
    const visibleIds = this.paginatedStudents.map(s => s.studentId);
    return visibleIds.length > 0 && visibleIds.every(id => this.selectedStudents.includes(id));
  }



  onNextClassChange(): void {
    const selectedClass = this.classes.find(c => c.standardId === Number(this.nextClassId));
    if (selectedClass) {
      this.filteredNextSections = this.sections.filter(s => s.className === selectedClass.standardName);

      if (this.filteredNextSections.length === 0) {
        this.popup.warning(`There are no sections created for <strong>${selectedClass.standardName}</strong>. Please create a section before promoting.`, 'Section Required');
        this.nextSectionId = 0;
      } else {
        // Auto-select first section if available
        this.nextSectionId = this.filteredNextSections[0].sectionId;
      }
    } else {
      this.filteredNextSections = [];
      this.nextSectionId = 0;
    }
  }

  promoteSelected(): void {
    if (this.selectedStudents.length === 0) {
      this.popup.warning('Please select at least one student to promote.', 'Selection Required');
      return;
    }

    if (!this.nextClassId || !this.nextSectionId || !this.nextAcademicYearId) {
      this.popup.warning('Please select destination Class, Section, and Academic Year.', 'Destination Incomplete');
      return;
    }

    const count = this.selectedStudents.length;

    this.popup.confirm(
      'Promote Students?',
      `Are you sure you want to promote <strong>${count}</strong> selected student${count > 1 ? 's' : ''} to the next academic term?`,
      'Yes, Promote',
      'Cancel',
      'success'
    ).then(confirmed => {
      if (confirmed) {
        this.confirmPromotion();
      }
    });
  }

  confirmPromotion() {
    this.popup.loading('Promoting students...');
    const request = {
      studentIds: this.selectedStudents,
      nextClassId: Number(this.nextClassId),
      nextSectionId: Number(this.nextSectionId),
      nextAcademicYearId: Number(this.nextAcademicYearId)
    };

    this.studentService.bulkPromote(request).subscribe({
      next: (res) => {
        this.popup.closeLoading();
        this.popup.success('Promotion Successful', res.message || 'Students have been promoted successfully.');
        this.selectedStudents = [];
        this.loadInitialData();
      },
      error: (err) => {
        console.error('Promotion error', err);
        this.popup.closeLoading();
        const errorMsg = err.error && typeof err.error === 'string'
          ? err.error
          : (err.error?.message ? err.error.message : 'Failed to promote students.');
        this.popup.error(errorMsg, 'Promotion Failed');
      }
    });
  }

  getSelectedClassName(): string {
    const cls = this.classes.find(c => c.standardId === Number(this.selectedClassId));
    return cls ? cls.standardName : 'All Classes';
  }

  getSelectedSectionName(): string {
    const sec = this.sections.find(s => s.sectionId === Number(this.selectedSectionId));
    return sec ? sec.sectionName : 'All Sections';
  }
}


