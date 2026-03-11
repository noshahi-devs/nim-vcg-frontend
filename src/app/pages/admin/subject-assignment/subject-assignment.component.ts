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
    this.model.subjectRows = []; // Bug fix 3: Reset subjectRows to empty array

    if (this.model.standardId) {
      const selectedClass = this.classes.find((c: any) => c.standardId == this.model.standardId);
      if (selectedClass) {
        console.log("Selected Class:", selectedClass);
        this.sectionService.getSections().subscribe({
          next: (res) => {
            console.log("All Sections:", res);
            // Bug fix 2: Case-insensitive comparison for section filtering
            const name = (selectedClass.standardName || '').trim().toLowerCase();
            this.sections = (res || []).filter((x: any) =>
              (x.className || '').trim().toLowerCase() === name
            );
            console.log("Filtered Sections for class:", this.sections);
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
    // Reset subject rows and add first row when a section is selected
    this.model.subjectRows = [];
    this.addSubjectRow();
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
