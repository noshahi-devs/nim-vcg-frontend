import { Component, OnInit, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from '../../../swal';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { SubjectService } from '../../../services/subject.service';
import { Subject } from '../../../Models/subject';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SectionService } from '../../../services/section.service';
import { SubjectAssignmentService } from '../../../core/services/subject-assignment.service';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { StandardService } from '../../../services/standard.service';
import { Standard } from '../../../Models/standard';


declare var bootstrap: any;

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, RouterLink],
  templateUrl: './subject-list.component.html',
  styleUrls: ['./subject-list.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SubjectListComponent implements OnInit, AfterViewInit {
  title = 'Subject List';
  searchTerm = '';
  filterClass = '';
  subjectToDelete: Subject | null = null;
  selectedSubject: Subject = new Subject();
  allStandards: Standard[] = [];
  editLoading = false;
  
  // Premium Modal Visibility State
  showViewModal = false;
  showEditModal = false;
  showDeleteModal = false;
  
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;

  get totalSubjects(): number { return this.subjectList.length; }
  get classesWithSubjectsCount(): number { return new Set(this.subjectList.map(s => s.standard?.standardId)).size; }

  standards: string[] = [];
  subjectList: Subject[] = [];
  classes: string[];
  assignedSubjectIds: number[] = [];

  constructor(
    private subjectService: SubjectService,
    private authService: AuthService,
    private staffService: StaffService,
    private sectionService: SectionService,
    private subjectAssignmentService: SubjectAssignmentService,
    private standardService: StandardService
  ) { }


  ngOnInit(): void {
    this.loadSubjects();
    this.loadStandards();
  }

  loadStandards(): void {
    this.standardService.getStandards().subscribe({
      next: (res) => this.allStandards = res,
      error: () => console.error('Failed to load standards')
    });
  }

  ngAfterViewInit(): void { }

  loadSubjects(): void {
    const isTeacher = this.authService.hasAnyRole(['Teacher']);
    const currentUser = this.authService.userValue;

    if (isTeacher && currentUser?.email) {
      this.staffService.getAllStaffs().pipe(
        catchError(() => {
          this.subjectList = [];
          return of([]);
        })
      ).subscribe({
        next: (staffs) => {
          const staff = staffs.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
          if (staff) {
            this.fetchAndFilterSubjects(staff.staffId);
          } else {
            // HARDENED: If teacher but no staff record found, show empty list, not everything
            this.subjectList = [];
            this.classes = [];
            this.showFeedback('warning', 'Teacher record not found', 'Please contact administrator for staff mapping.');
          }
        }
      });
    } else {
      this.fetchAllSubjectsRaw();
    }
  }

  private fetchAllSubjectsRaw(): void {
    this.subjectService.getSubjects().subscribe({
      next: (res) => {
        this.subjectList = res;
        this.classes = [...new Set(res.map(s => s.standard?.standardName || ''))];
      },
      error: (err) => {
        console.error('Error loading subjects:', err);
        this.showFeedback('error', 'Sync Failed', 'Unable to retrieve academic subject registry.');
      }
    });
  }

  private fetchAndFilterSubjects(staffId: number): void {
    forkJoin({
      subjects: this.subjectService.getSubjects(),
      sections: this.sectionService.getSections(),
      assignments: this.subjectAssignmentService.getAssignmentsByTeacher(staffId)
    }).subscribe({
      next: (res) => {
        // Find sections assigned to this teacher
        const assignedSectionClassNames = (res.sections || [])
          .filter(s => s.staffId === staffId)
          .map(s => s.className);

        const assignedSubjectClassNames = (res.assignments || [])
          .map(a => a.subject?.standard?.standardName)
          .filter(name => !!name);

        const allAssignedClassNames = [...new Set([...assignedSectionClassNames, ...assignedSubjectClassNames])];

        // Find specific subjects assigned to this teacher
        this.assignedSubjectIds = (res.assignments || []).map(a => a.subjectId);

        // STRICT FILTERING: Only show subjects specifically assigned to this teacher by ID
        this.subjectList = res.subjects.filter(s => this.assignedSubjectIds.includes(s.subjectId));
        this.classes = allAssignedClassNames;
      },
      error: (err) => {
        console.error('Error loading filtered subjects:', err);
        this.showFeedback('error', 'Filter Failed', 'Could not synchronize curriculum for your assigned classes.');
      }
    });
  }


  get filteredSubjectList() {
    let list = this.subjectList;
    if (this.filterClass) {
      list = list.filter(s => s.standard?.standardName === this.filterClass);
    }
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(s =>
        (s.subjectName?.toLowerCase().includes(search) ?? false) ||
        (s.standard?.standardName.toLowerCase().includes(search) ?? false)
      );
    }
    return list;
  }

  confirmDelete(subject: Subject): void {
    this.subjectToDelete = subject;
    this.showDeleteModal = true;
  }

  deleteSubject(): void {
    if (!this.subjectToDelete) return;

    this.isProcessing = true;
    this.subjectService.deleteSubject(this.subjectToDelete.subjectId).pipe(
      finalize(() => this.isProcessing = false)
    ).subscribe({
      next: () => {
        this.subjectList = this.subjectList.filter(s => s.subjectId !== this.subjectToDelete?.subjectId);
        this.showFeedback('success', 'Subject Deleted', 'The academic record has been removed permanently.');
        this.subjectToDelete = null;
        this.showDeleteModal = false;
      },
      error: (err) => {
        console.error('Error deleting subject:', err);
        let errorMsg = 'Failed to delete record. It may have dependent records (Marks or Assignments).';
        
        if (err.error) {
          if (typeof err.error === 'string' && err.error.length < 200) {
            errorMsg = err.error;
          } else if (err.error.message && err.error.message.length < 200) {
            errorMsg = err.error.message;
          }
        }
        
        this.showFeedback('error', 'Cannot Delete', errorMsg);
      }
    });
  }

  isAdminOrPrincipal(): boolean {
    return this.authService.hasAnyRole(['Admin', 'Principal']);
  }

  openViewModal(subject: Subject): void {
    this.selectedSubject = { ...subject };
    this.showViewModal = true;
  }

  openEditModal(subject: Subject): void {
    this.selectedSubject = { ...subject };
    this.showEditModal = true;
  }

  updateSubject(): void {
    if (!this.selectedSubject.subjectName || !this.selectedSubject.standardId) {
      this.showFeedback('warning', 'Fields Required', 'Please ensure all mandatory academic details are provided.');
      return;
    }

    this.isProcessing = true;
    this.subjectService.updateSubject(this.selectedSubject).pipe(
      finalize(() => this.isProcessing = false)
    ).subscribe({
      next: () => {
        this.showFeedback('success', 'Subject Updated', 'The academic record has been successfully modified.');
        this.loadSubjects();
        this.showEditModal = false;
      },
      error: (err) => {
        console.error('Error updating subject:', err);
        let errorMsg = 'Failed to save academic changes.';
        
        if (err.error) {
          if (typeof err.error === 'string' && err.error.length < 200) {
            errorMsg = err.error;
          } else if (err.error.message && err.error.message.length < 200) {
            errorMsg = err.error.message;
          }
        }
        
        this.showFeedback('error', 'Update Failed', errorMsg);
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


