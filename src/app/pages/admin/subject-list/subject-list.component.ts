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
import { catchError } from 'rxjs/operators';
import { StandardService } from '../../../services/standard.service';
import { Standard } from '../../../Models/standard';
import { PopupService } from '../../../services/popup.service';


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
  subjectToDelete: Subject | null = null;
  selectedSubject: Subject = new Subject();
  allStandards: Standard[] = [];
  editLoading = false;
  loading = false;
  Math = Math;

  // Pagination
  currentPage = 1;
  rowsPerPage = 12;

  // Premium Modal Visibility State
  showViewModal = false;
  showEditModal = false;

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
    private standardService: StandardService,
    private popup: PopupService
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
    this.loading = true;
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
            this.loading = false;
            this.popup.warning('Please contact administrator for staff mapping.', 'Teacher record not found');
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
        this.loading = false;
        this.subjectList = res;
        this.classes = [...new Set(res.map(s => s.standard?.standardName || ''))];
        this.currentPage = 1;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading subjects:', err);
        this.popup.error('Sync Failed', 'Unable to retrieve academic subject registry.');
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
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error('Error loading filtered subjects:', err);
        this.popup.error('Filter Failed', 'Could not synchronize curriculum for your assigned classes.');
      }
    });
  }


  get filteredSubjectList() {
    let list = this.subjectList;
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(s =>
        (s.subjectName?.toLowerCase().includes(search) ?? false) ||
        (s.standard?.standardName.toLowerCase().includes(search) ?? false)
      );
    }
    return list;
  }

  get paginatedSubjectList() {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredSubjectList.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSubjectList.length / this.rowsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  confirmDelete(subject: Subject): void {
    this.popup.confirm(
      'Confirm Deletion',
      `Are you sure you want to delete <strong>${subject.subjectName}</strong>?<br>This action cannot be undone.`
    ).then((confirmed) => {
      if (confirmed) {
        this.subjectToDelete = subject;
        this.deleteSubject();
      }
    });
  }

  deleteSubject(): void {
    if (!this.subjectToDelete) return;

    this.isProcessing = true;
    this.popup.loading('Deleting permanently...');
    this.subjectService.deleteSubject(this.subjectToDelete.subjectId).subscribe({
      next: () => {
        this.isProcessing = false;
        this.popup.closeLoading();
        this.subjectList = this.subjectList.filter(s => s.subjectId !== this.subjectToDelete?.subjectId);
        this.subjectToDelete = null;
        this.popup.deleted('Subject');
      },
      error: (err) => {
        this.isProcessing = false;
        this.popup.closeLoading();
        console.error('Error deleting subject:', err);
        let errorMsg = 'Failed to delete record. It may have dependent records (Marks or Assignments).';

        if (err.error) {
          if (typeof err.error === 'string' && err.error.length < 200) {
            errorMsg = err.error;
          } else if (err.error.message && err.error.message.length < 200) {
            errorMsg = err.error.message;
          }
        }

        const name = this.subjectToDelete?.subjectName || 'This subject';
        this.popup.deleteError(name, errorMsg);
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
      this.popup.warning('Please ensure all mandatory academic details are provided.', 'Fields Required');
      return;
    }

    this.isProcessing = true;
    this.popup.loading('Saving subject...');
    this.subjectService.updateSubject(this.selectedSubject).subscribe({
      next: () => {
        this.isProcessing = false;
        this.popup.closeLoading();
        this.popup.updated('Subject');
        this.loadSubjects();
        this.showEditModal = false;
      },
      error: (err) => {
        this.isProcessing = false;
        this.popup.closeLoading();
        console.error('Error updating subject:', err);
        let errorMsg = 'Failed to save academic changes.';

        if (err.error) {
          if (typeof err.error === 'string' && err.error.length < 200) {
            errorMsg = err.error;
          } else if (err.error.message && err.error.message.length < 200) {
            errorMsg = err.error.message;
          }
        }

        this.popup.error('Update Failed', errorMsg);
      }
    });
  }
}


