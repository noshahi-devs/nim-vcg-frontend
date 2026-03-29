import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SubjectAssignmentService, SubjectAssignment } from '../../../core/services/subject-assignment.service';
import { StaffService } from '../../../services/staff.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { SubjectService } from '../../../services/subject.service';
import { ThemeService } from '../../../services/theme.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { AppConfigService } from '../../../services/app-config.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PopupService } from '../../../services/popup.service';


export interface GroupedAssignment {
  staffId: number;
  staffName: string;
  sectionId: number;
  sectionName: string;
  className: string;
  assignments: { assignmentId: number; subjectId: number; subjectName: string }[];
}

@Component({
  selector: 'app-subject-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './subject-assignment.component.html',
  styleUrl: './subject-assignment.component.css'
})
export class SubjectAssignmentComponent implements OnInit {
  assignments: SubjectAssignment[] = [];
  teachers: any[] = [];
  classes: any[] = [];
  sections: any[] = [];
  subjectList: any[] = []; // Full list of subjects for lookup

  // Model for the new design
  model: any = {
    staffId: null,
    standardId: null,
    sectionId: null,
    selectedSubjectIds: [] // Multiple selection via checkboxes
  };

  loading: boolean = false;
  isProcessing: boolean = false;
  
  errorMessage: string | null = null;
  searchTerm: string = '';

  // Pagination State
  paginatedGroupedAssignments: GroupedAssignment[] = [];
  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  Math = Math;

  constructor(
  // ... existing constructor ...
    private assignmentService: SubjectAssignmentService,
    private staffService: StaffService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private subjectService: SubjectService,
    private router: Router,
    private popup: PopupService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = null;

    console.log("Loading Subject Assignment initial data...");

    // Wait for all critical data
    forkJoin({
      assignments: this.assignmentService.getAllAssignments(),
      teachers: this.staffService.getAllStaffs(),
      classes: this.standardService.getStandards(),
      subjects: this.subjectService.getSubjects()
    }).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (res: any) => {
        console.log("Subject Assignment Data loaded:", res);
        
        // Assignments
        this.assignments = res.assignments || [];
        this.updatePagination();

        // Teachers (Filter by designation)
        this.teachers = (res.teachers || []).filter((s: any) => 
          s.designation === 'Teacher' || 
          (typeof s.designation === 'string' && s.designation.toLowerCase() === 'teacher')
        );

        // Classes
        this.classes = res.classes || [];

        // Subjects
        this.subjectList = res.subjects || [];
      },
      error: (err) => {
        console.error("Failed to load initial data", err);
        this.errorMessage = "Failed to synchronize with server.";
        this.popup.error('Sync Error', 'Failed to load initial data. Please check your connectivity.');
      }
    });
  }

  get filteredAssignments(): SubjectAssignment[] {
    const search = this.searchTerm.toLowerCase().trim();
    if (!search) return this.assignments;

    return this.assignments.filter(a =>
      a.staff?.staffName?.toLowerCase().includes(search) ||
      a.subject?.subjectName?.toLowerCase().includes(search) ||
      (a.section as any)?.className?.toLowerCase().includes(search) ||
      a.section?.sectionName?.toLowerCase().includes(search)
    );
  }

  get groupedAssignments(): GroupedAssignment[] {
    const filtered = this.filteredAssignments;
    const map = new Map<string, GroupedAssignment>();

    filtered.forEach(a => {
      const key = `${a.staffId}-${a.sectionId}`;
      if (!map.has(key)) {
        map.set(key, {
          staffId: a.staffId || 0,
          staffName: a.staff?.staffName || 'Unknown Teacher',
          sectionId: a.sectionId || 0,
          sectionName: a.section?.sectionName || 'Unknown Section',
          // Section has a 'className' string field, not a 'standard' navigation property
          className: (a.section as any)?.className || '',
          assignments: []
        });
      }
      map.get(key)!.assignments.push({
        assignmentId: a.subjectAssignmentId,
        subjectId: a.subjectId || 0,
        subjectName: a.subject?.subjectName || 'Unknown Subject'
      });
    });

    return Array.from(map.values()).sort((a, b) => a.staffName.localeCompare(b.staffName));
  }

  onClassChange(): void {
    this.sections = [];
    this.model.sectionId = null;
    this.model.selectedSubjectIds = [];

    if (this.model.standardId) {
      const selectedClass = this.classes.find((c: any) => c.standardId == this.model.standardId);
      if (selectedClass) {
        this.sectionService.getSections().subscribe({
          next: (res) => {
            const name = (selectedClass.standardName || '').trim().toLowerCase();
            this.sections = (res || []).filter((x: any) =>
              (x.className || '').trim().toLowerCase() === name
            );
          },
          error: (err) => {
            console.error("Failed to load sections", err);
            this.popup.error('Error', 'Failed to load sections.');
          }
        });
      }
    }
  }

  onSectionChange(): void {
    this.model.selectedSubjectIds = [];
  }

  toggleSubject(subjectId: number): void {
    const index = this.model.selectedSubjectIds.indexOf(subjectId);
    if (index > -1) {
      this.model.selectedSubjectIds.splice(index, 1);
    } else {
      this.model.selectedSubjectIds.push(subjectId);
    }
  }

  isSubjectSelected(subjectId: number): boolean {
    return this.model.selectedSubjectIds.includes(subjectId);
  }

  selectAllSubjects(): void {
    const availableSubjects = this.filteredSubjects;
    if (this.model.selectedSubjectIds.length === availableSubjects.length) {
      this.model.selectedSubjectIds = [];
    } else {
      this.model.selectedSubjectIds = availableSubjects.map(s => s.subjectId);
    }
  }

  get assignedSubjectIds(): number[] {
    if (!this.model.sectionId) return [];
    return this.assignments
      .filter(a => a.sectionId == this.model.sectionId)
      .map(a => a.subjectId as number);
  }

  get filteredSubjects(): any[] {
    if (!this.model.standardId) return [];
    const subjectsForClass = this.subjectList.filter(s => 
      s.standardId == this.model.standardId || 
      s.standard?.standardId == this.model.standardId
    );
    
    const assignedIds = this.assignedSubjectIds;
    return subjectsForClass.filter(s => !assignedIds.includes(s.subjectId));
  }

  get allSubjectsAssigned(): boolean {
    if (!this.model.sectionId || !this.model.standardId) return false;
    const subjectsForClass = this.subjectList.filter(s => 
      s.standardId == this.model.standardId || 
      s.standard?.standardId == this.model.standardId
    );
    if (subjectsForClass.length === 0) return false;
    
    return this.filteredSubjects.length === 0;
  }

  assignSubject(): void {
    if (!this.model.staffId || !this.model.sectionId || this.model.selectedSubjectIds.length === 0) {
      this.popup.warning('Please select Teacher, Section, and at least one Subject.', 'Validation Error');
      return;
    }

    this.isProcessing = true;
    const requests = this.model.selectedSubjectIds.map((subjectId: number) => {
      return this.assignmentService.addAssignment({
        staffId: this.model.staffId,
        sectionId: this.model.sectionId,
        subjectId: subjectId
      } as any);
    });

    // No extra step needed here as we use isProcessing for overlay

    forkJoin(requests).subscribe({
      next: (res: any[]) => {
        this.isProcessing = false;
        this.popup.success('Assigned!', `${res.length} subjects assigned successfully.`);

        this.loadInitialData();
        this.model.selectedSubjectIds = [];
      },
      error: (err) => {
        this.isProcessing = false;
        const msg = err.error?.message || 'Failed to assign subjects.';
        this.popup.error('Error', msg);
      }
    });
  }

  confirmDelete(id: number): void {
    this.popup.confirm('Delete Assignment?', 'Are you sure you want to delete this subject assignment from the teacher/class?', 'Yes, Delete', 'Cancel').then((confirmed) => {
      if (confirmed) {
        this.removeAssignment(id);
      }
    });
  }

  removeAssignment(assignmentId: number): void {
    if (!assignmentId) return;

    this.isProcessing = true;
    this.popup.loading('Deleting assignment...');
    this.assignmentService.deleteAssignment(assignmentId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.popup.closeLoading();
        this.popup.deleted('Assignment');
        this.loadInitialData();
      },
      error: () => {
        this.isProcessing = false;
        this.popup.closeLoading();
        this.popup.deleteError('Assignment', 'Could not delete assignment');
      }
    });
  }

  // --- Pagination Methods ---
  updatePagination() {
    const grouped = this.groupedAssignments;
    this.totalPages = Math.ceil(grouped.length / this.rowsPerPage) || 1;
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedGroupedAssignments = grouped.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }
}
