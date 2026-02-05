import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { StudentService } from '../../../services/student.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-student-promote',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-promote.component.html',
  styleUrls: ['./student-promote.component.css']
})
export class StudentPromoteComponent implements OnInit {
  title = 'Student Promotion';
  Math = Math;

  students: Student[] = [];
  filteredStudents: Student[] = [];
  selectedStudents: number[] = [];

  classes: Standard[] = [];
  sections: Section[] = [];

  searchTerm: string = '';
  selectedClassId: number = 0;
  selectedSectionId: number = 0;

  rowsPerPage: number = 10;
  currentPage: number = 1;

  nextClassId: number = 0;
  nextSectionId: number = 0;

  loading = false;

  constructor(
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService
  ) { }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.standardService.getStandards().subscribe(data => this.classes = data || []);
    this.sectionService.getSections().subscribe(data => this.sections = data || []);
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading = true;
    this.studentService.GetStudents()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data) => {
          this.students = data || [];
          this.filterStudents();
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Error', 'Unable to load student data.', 'error');
        }
      });
  }

  filterStudents(): void {
    const search = this.searchTerm.toLowerCase().trim();
    this.filteredStudents = this.students.filter(s => {
      const matchSearch = !search ||
        s.studentName?.toLowerCase().includes(search) ||
        s.admissionNo?.toString().includes(search);

      const matchClass = !this.selectedClassId || s.standardId === this.selectedClassId;
      const matchSection = !this.selectedSectionId || s.section === this.sections.find(sec => sec.sectionId === this.selectedSectionId)?.sectionName;

      return matchSearch && matchClass && matchSection;
    });
    this.currentPage = 1;
    this.selectedStudents = [];
  }

  get paginatedStudents(): Student[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredStudents.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredStudents.length / this.rowsPerPage) || 1;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  toggleSelection(studentId: number): void {
    const index = this.selectedStudents.indexOf(studentId);
    if (index > -1) {
      this.selectedStudents.splice(index, 1);
    } else {
      this.selectedStudents.push(studentId);
    }
  }

  toggleAllSelections(event: any): void {
    const checked = event.target.checked;
    const visibleIds = this.paginatedStudents.map(s => s.studentId);
    this.selectedStudents = checked
      ? Array.from(new Set([...this.selectedStudents, ...visibleIds]))
      : this.selectedStudents.filter(id => !visibleIds.includes(id));
  }

  areAllSelected(): boolean {
    const visibleIds = this.paginatedStudents.map(s => s.studentId);
    return visibleIds.length > 0 && visibleIds.every(id => this.selectedStudents.includes(id));
  }

  promoteSelected(): void {
    if (!this.nextClassId || !this.nextSectionId) {
      Swal.fire('Warning', 'Please select destination class and section before promoting.', 'warning');
      return;
    }
    if (this.selectedStudents.length === 0) {
      Swal.fire('Warning', 'Please select at least one student to promote.', 'warning');
      return;
    }

    const nextClass = this.classes.find(c => c.standardId === this.nextClassId)?.standardName;
    const nextSection = this.sections.find(s => s.sectionId === this.nextSectionId)?.sectionName;

    Swal.fire({
      title: 'Confirm Promotion',
      text: `Are you sure you want to promote ${this.selectedStudents.length} students to ${nextClass} - ${nextSection}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Promote Now!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        this.processPromotion();
      }
    });
  }

  processPromotion(): void {
    Swal.fire({
      title: 'Promoting Students...',
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false
    });

    // In a real app, this would be a bulk API call.
    // For now, we simulate success and update the local list.
    setTimeout(() => {
      Swal.fire('Success!', `${this.selectedStudents.length} students have been promoted.`, 'success');
      this.loadStudents(); // Reload to reflect changes
      this.selectedStudents = [];
    }, 1500);
  }
}