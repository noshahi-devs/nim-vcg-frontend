import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SubjectAssignmentService, SubjectAssignment } from '../../../core/services/subject-assignment.service';
import { StaffService } from '../../../services/staff.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { SubjectService } from '../../../services/subject.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from '../../../swal';


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
  
  // Premium Modal State
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  redirectOnClose = false;

  // For Deletion Confirmation
  showDeleteModal = false;
  assignmentToDelete: number | null = null;

  errorMessage: string | null = null;
  searchTerm: string = '';

  constructor(
  // ... existing constructor ...
    private assignmentService: SubjectAssignmentService,
    private staffService: StaffService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private subjectService: SubjectService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;
    this.errorMessage = null;

    console.log("Loading Subject Assignment initial data...");

    // Load existing assignments
    this.assignmentService.getAllAssignments().subscribe({
      next: (res) => {
        console.log("Assignments loaded:", res);
        this.assignments = res || [];
        this.loading = false;
      },
      error: (err) => {
        console.error("Failed to load assignments", err);
        this.errorMessage = "Failed to load existing assignments.";
        this.loading = false;
        Swal.fire('Error', 'Failed to load existing assignments. Please check connectivity.', 'error');
      }
    });

    // Load Teachers
    this.staffService.getAllStaffs().subscribe({
      next: (res) => {
        console.log("Staff loaded:", res);
        this.teachers = (res || []).filter((s: any) => 
          s.designation === 'Teacher' || 
          (typeof s.designation === 'string' && s.designation.toLowerCase() === 'teacher')
        );
        console.log("Filtered Teachers:", this.teachers);
      },
      error: (err) => {
        console.error("Failed to load teachers", err);
        Swal.fire('Error', 'Failed to load teachers.', 'error');
      }
    });

    // Load Classes
    this.standardService.getStandards().subscribe({
      next: (res) => {
        console.log("Classes loaded:", res);
        this.classes = res || [];
      },
      error: (err) => {
        console.error("Failed to load classes", err);
        Swal.fire('Error', 'Failed to load classes.', 'error');
      }
    });

    // Load All Subjects for the dynamic rows
    this.subjectService.getSubjects().subscribe({
      next: (res) => {
        console.log("Subjects loaded:", res);
        this.subjectList = res || [];
      },
      error: (err) => {
        console.error("Failed to load subjects", err);
        Swal.fire('Error', 'Failed to load subjects.', 'error');
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
            Swal.fire('Error', 'Failed to load sections.', 'error');
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
      this.showFeedback('warning', 'Validation Error', 'Please select Teacher, Section, and at least one Subject.');
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
        this.showFeedback('success', 'Assigned!', `${res.length} subjects assigned successfully.`);

        this.loadInitialData();
        this.model.selectedSubjectIds = [];
      },
      error: (err) => {
        this.isProcessing = false;
        const msg = err.error?.message || 'Failed to assign subjects.';
        this.showFeedback('error', 'Error', msg);
      }
    });
  }

  confirmDelete(id: number): void {
    this.assignmentToDelete = id;
    this.showDeleteModal = true;
  }

  removeAssignment(id: number | null): void {
    const assignmentId = id || this.assignmentToDelete;
    if (!assignmentId) return;

    this.isProcessing = true;
    this.assignmentService.deleteAssignment(assignmentId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.showFeedback('success', 'Removed!', 'The assignment has been deleted.');
        this.loadInitialData();
        this.showDeleteModal = false;
        this.assignmentToDelete = null;
      },
      error: () => {
        this.isProcessing = false;
        this.showFeedback('error', 'Error', 'Could not delete assignment');
        this.showDeleteModal = false;
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
}
