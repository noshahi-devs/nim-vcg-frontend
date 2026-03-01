import { Component, OnInit, AfterViewInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { SubjectService } from '../../../services/subject.service';
import { Subject } from '../../../Models/subject';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SectionService } from '../../../services/section.service';
import { SubjectAssignmentService } from '../../../services/subject-assignment.service';
import { forkJoin } from 'rxjs';


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

  get totalSubjects(): number { return this.subjectList.length; }
  get classesWithSubjectsCount(): number { return new Set(this.subjectList.map(s => s.standard?.standardId)).size; }

  standards: string[] = [];
  subjectList: Subject[] = [];
  classes: string[];

  constructor(
    private subjectService: SubjectService,
    private authService: AuthService,
    private staffService: StaffService,
    private sectionService: SectionService,
    private subjectAssignmentService: SubjectAssignmentService
  ) { }


  ngOnInit(): void {
    this.loadSubjects();
  }

  ngAfterViewInit(): void { }

  loadSubjects(): void {
    const isTeacher = this.authService.hasAnyRole(['Teacher']);
    const currentUser = this.authService.userValue;

    if (isTeacher && currentUser?.email) {
      this.staffService.getAllStaffs().subscribe({
        next: (staffs) => {
          const staff = staffs.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
          if (staff) {
            this.fetchAndFilterSubjects(staff.staffId);
          } else {
            this.fetchAllSubjectsRaw();
          }
        },
        error: () => this.fetchAllSubjectsRaw()
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
      error: () => Swal.fire('Error', 'Failed to load subjects', 'error')
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

        // Filter subjects by those class names
        this.subjectList = res.subjects.filter(s => allAssignedClassNames.includes(s.standard?.standardName || ''));
        this.classes = allAssignedClassNames;
      },
      error: () => Swal.fire('Error', 'Failed to load filtered subjects', 'error')
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
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
  }

  deleteSubject(): void {
    if (!this.subjectToDelete) return;

    this.subjectService.deleteSubject(this.subjectToDelete.subjectId).subscribe({
      next: () => {
        this.subjectList = this.subjectList.filter(s => s.subjectId !== this.subjectToDelete?.subjectId);
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Subject has been deleted.',
          timer: 1500,
          showConfirmButton: false
        });
        this.subjectToDelete = null;
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal?.hide();
      },
      error: () => Swal.fire('Error', 'Failed to delete subject', 'error')
    });
  }

  isAdminOrPrincipal(): boolean {
    return this.authService.hasAnyRole(['Admin', 'Principal']);
  }
}
