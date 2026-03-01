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

  sections = ['A', 'B', 'C', 'D'];

  classList: Standard[] = [];

  get totalClasses(): number { return this.classList.length; }
  get sumStudents(): number { return this.classList.reduce((acc, curr) => acc + (curr.students?.length || 0), 0); }
  get sumSubjects(): number { return this.classList.reduce((acc, curr) => acc + (curr.subjects?.length || 0), 0); }

  // Teacher specific context
  isTeacher = false;
  staffId: number | null = null;
  assignedClassNames: string[] = [];
  loading = false;

  constructor(
    private standardService: StandardService,
    private authService: AuthService,
    private staffService: StaffService,
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
            this.loadClasses();
          }
        },
        error: () => this.loadClasses()
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

    this.assignmentService.getAssignmentsByTeacher(this.staffId).subscribe({
      next: (assignments) => {
        const classes = assignments.map(a => a.subject?.standard?.standardName
          || (a.section as any)?.className);
        this.assignedClassNames = [...new Set(classes.filter(c => !!c))];
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
          this.classList = this.classList.filter(c => this.assignedClassNames.includes(c.standardName));
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
      list = list.filter(c => c.section === this.filterSection);
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

  ngAfterViewInit() { }
}
