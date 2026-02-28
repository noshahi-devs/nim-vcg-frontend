import { Component, OnInit } from '@angular/core';
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
    subjectId: null,
    sectionId: null
  };

  selectedClassId: number | null = null;
  loading: boolean = false;
  isSubmitting: boolean = false;

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
      next: (res) => this.assignments = res,
      error: (err) => console.error("Failed to load assignments", err)
    });

    // Load Teachers (Academic Staff)
    this.staffService.getAllStaffs().subscribe({
      next: (res) => {
        const academicRoles = ['DepartmentChair', 'Professor', 'Instructor', 'Lecturer', 'TeachingAssistant', 'SpecialEducationTeacher', 'SubstituteTeacher'];
        this.teachers = res.filter((s: any) => academicRoles.includes(s.designation));
      }
    });

    // Load all classes (Standards)
    this.standardService.getStandards().subscribe({
      next: (res) => this.classes = res
    });
  }

  onClassChange(): void {
    this.sections = [];
    this.subjects = [];
    this.newAssignment.sectionId = null;
    this.newAssignment.subjectId = null;

    if (this.selectedClassId) {
      this.loadSectionsDirect(this.selectedClassId);
      this.loadSubjectsDirect(this.selectedClassId);
    }
  }

  loadSectionsDirect(classId: number) {
    this.sectionService.getSections().subscribe(res => {
      this.sections = res.filter((x: any) => x.standardId == classId || x.standard?.standardId == classId);
    });
  }

  loadSubjectsDirect(classId: number) {
    this.subjectService.getSubjects().subscribe(res => {
      this.subjects = res.filter((x: any) => x.standardId == classId || x.standard?.standardId == classId);
    });
  }

  assignSubject(): void {
    if (!this.newAssignment.staffId || !this.newAssignment.subjectId || !this.newAssignment.sectionId) {
      Swal.fire('Validation Error', 'Please select a Teacher, Section, and Subject before assigning.', 'warning');
      return;
    }

    this.isSubmitting = true;
    this.assignmentService.addAssignment(this.newAssignment).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        Swal.fire('Assigned!', 'Subject assigned to teacher successfully.', 'success');
        this.loadInitialData(); // Refresh list

        // Reset form
        this.newAssignment.subjectId = null;
        this.newAssignment.sectionId = null;
        this.selectedClassId = null;
      },
      error: (err) => {
        this.isSubmitting = false;
        let errMsg = 'Failed to assign subject.';
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
