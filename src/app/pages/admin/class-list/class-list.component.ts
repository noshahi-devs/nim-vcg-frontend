import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Standard } from '../../../Models/standard';
import { StandardService } from '../../../services/standard.service';

declare var bootstrap: any;

import { SubjectAssignmentService } from '../../../core/services/subject-assignment.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SectionService } from '../../../services/section.service';
import { Section } from '../../../Models/section';
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
  filterSection = '';
  classToDelete: Standard | null = null;
  selectedClassForView: Standard | null = null;
  selectedClassForEdit: any = {}; // Using any for local edit state

  sections: string[] = [];
  assignedSections: Section[] = [];

  classList: Standard[] = [];

  get totalClasses(): number { return this.classList.length; }
  get sumStudents(): number { return this.classList.reduce((acc, curr) => acc + (curr.students?.length || 0), 0); }
  get sumSubjects(): number { return this.classList.reduce((acc, curr) => acc + (curr.subjects?.length || 0), 0); }

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
            // HARDENED: Prevent fallback
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
        // Specific Subject IDs assigned
        this.assignedSubjectIds = (res.assignments || []).map(a => a.subjectId);

        // Classes assigned
        const assignedClassNames = res.assignments.map(a => a.subject?.standard?.standardName
          || (a.section as any)?.className);
        this.assignedClassNames = [...new Set(assignedClassNames.filter(c => !!c))];

        // Sections assigned
        const classTeacherSections = res.sections.filter(s => s.staffId === this.staffId);
        const assignmentSectionIds = res.assignments.map(a => a.sectionId);
        const subjectSections = res.sections.filter(s => assignmentSectionIds.includes(s.sectionId));

        const uniqueSections = new Map<number, Section>();
        classTeacherSections.forEach(s => uniqueSections.set(s.sectionId, s));
        subjectSections.forEach(s => uniqueSections.set(s.sectionId, s));
        this.assignedSections = Array.from(uniqueSections.values());

        this.sections = [...new Set(this.assignedSections.map(s => s.sectionName))];

        this.loadClasses();
      },
      error: () => this.loadClasses()
    });
  }

  // **LOAD FROM REAL API**
  loadClasses() {
    this.standardService.getStandards().pipe(finalize(() => this.loading = false)).subscribe({
      next: (data) => {
        this.classList = data;
        if (this.isTeacher) {
          // Filter classes the teacher is involved in
          this.classList = this.classList.filter(c => this.assignedClassNames.includes(c.standardName));

          // STRICT FILTERING: Filter the subjects array WITHIN each class
          this.classList.forEach(classItem => {
            if (classItem.subjects) {
              classItem.subjects = classItem.subjects.filter(sub => this.assignedSubjectIds.includes(sub.subjectId));
            }
          });
        } else {
          // If not teacher, populate all unique section names for the dropdown
          this.sectionService.getSections().subscribe(secs => {
            this.sections = [...new Set(secs.map(s => s.sectionName))];
          });
        }
      },
      error: (err) => {
        console.error("API Load Error:", err);
      }
    });
  }

  // FILTER CLASS LIST
  get filteredClassList() {
    let list = this.classList;

    if (this.filterSection) {
      // Show classes that have this section
      list = list.filter(c => {
        // This logic depends on whether Standard has sections array or we look at assignedSections
        // For now, if teacher, check assignedSections. If admin, it's trickier without full mapping.
        // Assuming we want to filter by section name.
        if (this.isTeacher) {
          return this.assignedSections.some(s => s.className === c.standardName && s.sectionName === this.filterSection);
        }
        return true; // Admin sees all for now if we don't have the full mapping here
      });
    }

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(c =>
        c.standardName?.toLowerCase().includes(search)
      );
    }

    return list;
  }

  // OPEN DELETE MODAL
  confirmDelete(classItem: Standard) {
    this.classToDelete = classItem;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
  }

  // OPEN VIEW MODAL
  openViewModal(classItem: Standard) {
    this.selectedClassForView = classItem;
    const modal = new bootstrap.Modal(document.getElementById('viewModal'));
    modal.show();
  }

  // OPEN EDIT MODAL
  openEditModal(classItem: Standard) {
    this.selectedClassForEdit = { ...classItem };
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
  }

  // UPDATE CLASS
  updateClass() {
    if (!this.selectedClassForEdit) return;
    this.loading = true;
    this.standardService.updateStandard(this.selectedClassForEdit).subscribe({
      next: () => {
        this.loadClasses();
        const modal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        modal.hide();
        this.loading = false;
      },
      error: (err) => {
        console.error("Update API Error:", err);
        this.loading = false;
      }
    });
  }

  // DELETE FROM REAL API
  deleteClass() {
    if (!this.classToDelete) return;

    this.standardService.deleteStandard(this.classToDelete.standardId).subscribe({
      next: () => {
        this.classList = this.classList.filter(c => c.standardId !== this.classToDelete!.standardId);
        this.classToDelete = null;

        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
      },
      error: (err) => {
        console.error("Delete API Error:", err);
      }
    });
  }

  isAdminOrPrincipal(): boolean {
    return this.authService.hasAnyRole(['Admin', 'Principal']);
  }

  ngAfterViewInit() { }
}
