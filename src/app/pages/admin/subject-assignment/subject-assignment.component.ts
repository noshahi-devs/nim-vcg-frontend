import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SubjectAssignmentService, SubjectAssignment } from '../../../core/services/subject-assignment.service';
import { StaffService } from '../../../services/staff.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { SubjectService } from '../../../services/subject.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

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
  subjects: any[] = [];

  newAssignment: any = {
    staffId: null,
    sectionId: null
  };

  selectedSubjectIds: number[] = [];
  searchTerm: string = '';

  selectedClassId: number | null = null;
  loading: boolean = false;
  isSubmitting: boolean = false;

  // Missing data flags
  missingSections: boolean = false;
  missingSubjects: boolean = false;

  constructor(
    private assignmentService: SubjectAssignmentService,
    private staffService: StaffService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private subjectService: SubjectService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loading = true;

    // Load existing assignments
    this.assignmentService.getAllAssignments().subscribe({
      next: (res) => {
        this.assignments = res;
        this.loading = false;
      },
      error: (err) => {
        console.error("Failed to load assignments", err);
        this.loading = false;
      }
    });

    // Load Teachers (Academic Staff)
    this.staffService.getAllStaffs().subscribe({
      next: (res) => {
        this.teachers = (res || []).filter((s: any) => s.designation === 'Teacher');
      }
    });

    // Load all classes (Standards)
    this.standardService.getStandards().subscribe({
      next: (res) => this.classes = res
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

  onClassChange(): void {
    this.sections = [];
    this.subjects = [];
    this.newAssignment.sectionId = null;
    this.selectedSubjectIds = [];
    this.missingSections = false;
    this.missingSubjects = false;

    if (this.selectedClassId) {
      const selectedClass = this.classes.find(c => c.standardId == this.selectedClassId);
      if (selectedClass) {
        this.loadSectionsDirect(selectedClass.standardName);
        this.loadSubjectsDirect(this.selectedClassId);
      }
    }
  }

  loadSectionsDirect(className: string) {
    this.sectionService.getSections().subscribe(res => {
      this.sections = res.filter((x: any) => x.className === className);
      this.missingSections = this.sections.length === 0;
    });
  }

  loadSubjectsDirect(classId: number) {
    this.subjectService.getSubjects().subscribe(res => {
      this.subjects = res.filter((x: any) => x.standardId == classId || x.standard?.standardId == classId);
      this.missingSubjects = this.subjects.length === 0;
    });
  }

  toggleSubjectSelection(subjectId: number) {
    const index = this.selectedSubjectIds.indexOf(subjectId);
    if (index > -1) {
      this.selectedSubjectIds.splice(index, 1);
    } else {
      this.selectedSubjectIds.push(subjectId);
    }
  }

  isSubjectSelected(subjectId: number): boolean {
    return this.selectedSubjectIds.includes(subjectId);
  }

  selectAllSubjects(event: any) {
    if (event.target.checked) {
      this.selectedSubjectIds = this.subjects.map(s => s.subjectId);
    } else {
      this.selectedSubjectIds = [];
    }
  }

  assignSubject(): void {
    if (!this.newAssignment.staffId || !this.newAssignment.sectionId || this.selectedSubjectIds.length === 0) {
      Swal.fire('Validation Error', 'Please select a Teacher, Section, and at least one Subject.', 'warning');
      return;
    }

    this.isSubmitting = true;

    // Create an array of requests for each selected subject
    const requests = this.selectedSubjectIds.map(subId => {
      return this.assignmentService.addAssignment({
        staffId: this.newAssignment.staffId,
        sectionId: this.newAssignment.sectionId,
        subjectId: subId
      } as any);
    });

    forkJoin(requests).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        Swal.fire('Assigned!', `${res.length} subjects assigned successfully.`, 'success');
        this.loadInitialData(); // Refresh list

        // Reset form
        this.selectedSubjectIds = [];
        this.newAssignment.sectionId = null;
        this.selectedClassId = null;
      },
      error: (err) => {
        this.isSubmitting = false;
        let errMsg = 'Failed to assign subjects.';
        if (err.error?.message) errMsg = err.error.message;
        Swal.fire('Error', errMsg, 'error');
      }
    });
  }

  removeAssignment(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
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
