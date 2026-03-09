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
    subjectRows: []
  };

  loading: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string | null = null;
  searchTerm: string = '';

  constructor(
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

    // Load existing assignments
    this.assignmentService.getAllAssignments().subscribe({
      next: (res) => {
        this.assignments = res;
        this.loading = false;
      },
      error: (err) => {
        console.error("Failed to load assignments", err);
        this.errorMessage = "Failed to load existing assignments.";
        this.loading = false;
      }
    });

    // Load Teachers
    this.staffService.getAllStaffs().subscribe({
      next: (res) => {
        this.teachers = (res || []).filter((s: any) => s.designation === 'Teacher');
      }
    });

    // Load Classes
    this.standardService.getStandards().subscribe({
      next: (res) => this.classes = res
    });

    // Load All Subjects for the dynamic rows
    this.subjectService.getSubjects().subscribe({
      next: (res) => this.subjectList = res
    });
  }

  get filteredAssignments(): SubjectAssignment[] {
    const search = this.searchTerm.toLowerCase().trim();
    if (!search) return this.assignments;

    return this.assignments.filter(a =>
      a.staff?.staffName?.toLowerCase().includes(search) ||
      a.subject?.subjectName?.toLowerCase().includes(search) ||
      a.section?.standard?.standardName?.toLowerCase().includes(search) ||
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
          className: a.section?.standard?.standardName || '',
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
    this.model.subjectRows = [];

    if (this.model.standardId) {
      const selectedClass = this.classes.find(c => c.standardId == this.model.standardId);
      if (selectedClass) {
        this.sectionService.getSections().subscribe(res => {
          this.sections = res.filter((x: any) => x.className === selectedClass.standardName);
        });
        // Clear and add one initial row
        this.addSubjectRow();
      }
    }
  }

  addSubjectRow(): void {
    this.model.subjectRows.push({ subjectId: null });
  }

  removeSubjectRow(index: number): void {
    this.model.subjectRows.splice(index, 1);
    if (this.model.subjectRows.length === 0) {
      this.addSubjectRow();
    }
  }

  get filteredSubjects(): any[] {
    if (!this.model.standardId) return [];
    return this.subjectList.filter(s => s.standardId == this.model.standardId || s.standard?.standardId == this.model.standardId);
  }

  assignSubject(): void {
    if (!this.model.staffId || !this.model.sectionId || this.model.subjectRows.length === 0) {
      Swal.fire('Validation Error', 'Please select Teacher, Section, and at least one Subject.', 'warning');
      return;
    }

    const validRows = this.model.subjectRows.filter((r: any) => r.subjectId !== null);
    if (validRows.length === 0) {
      Swal.fire('Validation Error', 'Please select at least one Subject.', 'warning');
      return;
    }

    this.isSubmitting = true;
    const requests = validRows.map((row: any) => {
      return this.assignmentService.addAssignment({
        staffId: this.model.staffId,
        sectionId: this.model.sectionId,
        subjectId: row.subjectId
      } as any);
    });

    forkJoin(requests).subscribe({
      next: (res: any[]) => {
        this.isSubmitting = false;
        Swal.fire('Assigned!', `${res.length} subjects assigned successfully.`, 'success');

        this.loadInitialData();
        // Reset dynamic part
        this.model.subjectRows = [];
        this.addSubjectRow();
      },
      error: (err) => {
        this.isSubmitting = false;
        Swal.fire('Error', err.error?.message || 'Failed to assign subjects.', 'error');
      }
    });
  }

  removeAssignment(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.assignmentService.deleteAssignment(id).subscribe({
          next: () => {
            Swal.fire('Removed!', 'The assignment has been deleted.', 'success');
            this.loadInitialData();
          },
          error: () => Swal.fire('Error', 'Could not delete assignment', 'error')
        });
      }
    });
  }
}
