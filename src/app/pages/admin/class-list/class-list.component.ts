import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Standard } from '../../../Models/standard';
import { StandardService } from '../../../services/standard.service';
import { SubjectAssignmentService } from '../../../core/services/subject-assignment.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SectionService } from '../../../services/section.service';
import { forkJoin, finalize } from 'rxjs';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [BreadcrumbComponent, FormsModule, RouterLink, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './class-list.component.html',
  styleUrls: ['./class-list.component.css']
})
export class ClassListComponent implements OnInit, AfterViewInit {

  title = 'Class List';
  searchTerm = '';
  classToDelete: Standard | null = null;
  selectedClassForView: Standard | null = null;
  selectedClassForEdit: any = {}; // Using any for local edit state
  Math = Math;

  // Premium Modal Visibility State
  showViewModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showFeedbackModal = false;
  isProcessing = false;

  // Feedback State
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  // Pagination
  currentPage = 1;
  rowsPerPage = 12;

  classList: Standard[] = [];

  get totalClasses(): number { return this.classList.length; }
  get sumStudents(): number { return this.classList.reduce((acc, curr) => acc + (curr.totalStudents ?? curr.students?.length ?? 0), 0); }
  get sumSubjects(): number { return this.classList.reduce((acc, curr) => acc + (curr.totalSubjects ?? curr.subjects?.length ?? 0), 0); }

  // Teacher specific context
  isTeacher = false;
  staffId: number | null = null;
  assignedClassNames: string[] = [];
  assignedSubjectIds: number[] = [];
  loading = false;

  constructor(
    private standardService: StandardService,
    private authService: AuthService,
    private staffService: StaffService,
    private sectionService: SectionService,
    private assignmentService: SubjectAssignmentService
  ) { }

  // Pagination helpers
  get filteredClassList(): Standard[] {
    let list = this.classList;
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(c => c.standardName?.toLowerCase().includes(search));
    }
    return list;
  }

  get paginatedClassList(): Standard[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredClassList.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredClassList.length / this.rowsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  ngOnInit(): void {
    this.checkTeacherContext();
  }

  private checkTeacherContext() {
    this.loading = true;
    const roles: string[] = this.authService.roles || [];
    this.isTeacher = roles.some(r => r.toLowerCase() === 'teacher');
    const currentUser = this.authService.userValue;

    if (this.isTeacher && currentUser?.email) {
      this.staffService.getAllStaffs().subscribe({
        next: (staffs) => {
          const staff = staffs.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
          if (staff) {
            this.staffId = staff.staffId;
            this.loadTeacherAssignments();
          } else {
            this.classList = [];
            this.loading = false;
            console.warn("Teacher staff record not found for email:", currentUser.email);
          }
        },
        error: () => {
          this.classList = [];
          this.loading = false;
        }
      });
    } else {
      this.loadClasses();
    }
  }

  private loadTeacherAssignments() {
    if (!this.staffId) {
      this.loadClasses();
      return;
    }

    forkJoin({
      assignments: this.assignmentService.getAssignmentsByTeacher(this.staffId),
      sections: this.sectionService.getSections()
    }).subscribe({
      next: (res) => {
        this.assignedSubjectIds = (res.assignments || []).map(a => a.subjectId);
        const assignedClassNames = res.assignments.map(a => a.subject?.standard?.standardName || (a.section as any)?.className);
        this.assignedClassNames = [...new Set(assignedClassNames.filter(c => !!c))];
        this.loadClasses();
      },
      error: () => this.loadClasses()
    });
  }

  loadClasses() {
    this.standardService.getStandards().pipe(finalize(() => this.loading = false)).subscribe({
      next: (data) => {
        this.classList = data;
        this.currentPage = 1;
        if (this.isTeacher) {
          this.classList = this.classList.filter(c => this.assignedClassNames.includes(c.standardName));
          this.classList.forEach(classItem => {
            if (classItem.subjects) {
              classItem.subjects = classItem.subjects.filter(sub => this.assignedSubjectIds.includes(sub.subjectId));
            }
          });
        }
      },
      error: (err) => {
        console.error("API Load Error:", err);
      }
    });
  }

  confirmDelete(classItem: Standard) {
    this.classToDelete = classItem;
    this.showDeleteModal = true;
  }

  openViewModal(classItem: Standard) {
    this.selectedClassForView = classItem;
    this.showViewModal = true;
  }

  openEditModal(classItem: Standard) {
    this.selectedClassForEdit = { ...classItem };
    this.showEditModal = true;
  }

  updateClass() {
    if (!this.selectedClassForEdit || !this.selectedClassForEdit.standardId) {
      console.warn("No class selected for edit or missing ID");
      return;
    }
    
    this.isProcessing = true;
    console.log("Starting class update for ID:", this.selectedClassForEdit.standardId);

    this.standardService.updateStandard(this.selectedClassForEdit).pipe(
      finalize(() => {
        this.isProcessing = false;
        console.log("Class update operation finalized");
      })
    ).subscribe({
      next: (res) => {
        console.log("Class updated successfully:", res);
        this.loadClasses();
        this.showEditModal = false;
        this.showFeedback('success', 'Class Updated', 'Academic structure has been successfully modified.');
      },
      error: (err) => {
        console.error("Update API Error:", err);
        const errorMsg = err.error?.message || 'Unable to save changes to the academic record.';
        this.showFeedback('error', 'Update Failed', errorMsg);
      }
    });
  }

  deleteClass() {
    if (!this.classToDelete) return;
    this.isProcessing = true;
    this.standardService.deleteStandard(this.classToDelete.standardId).pipe(
      finalize(() => this.isProcessing = false)
    ).subscribe({
      next: () => {
        this.classList = this.classList.filter(c => c.standardId !== this.classToDelete!.standardId);
        this.showFeedback('success', 'Class Deleted', 'The academic record has been permanently removed.');
        this.classToDelete = null;
        this.showDeleteModal = false;
      },
      error: (err) => {
        console.error("Delete API Error:", err);
        const errorMsg = err.error?.message || 'Failed to delete class. It may have dependent records (Sections, Subjects, or Students).';
        this.showFeedback('error', 'Cannot Delete Class', errorMsg);
        this.showDeleteModal = false;
      }
    });
  }

  isAdminOrPrincipal(): boolean {
    return this.authService.hasAnyRole(['Admin', 'Principal']);
  }

  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
    if (type === 'success') {
      setTimeout(() => this.showFeedbackModal = false, 2500);
    }
  }

  ngAfterViewInit() { }
}
