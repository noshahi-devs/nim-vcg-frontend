import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StudentService } from '../services/student.service';
import { Student } from '../Models/student';

declare var bootstrap: any;

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [ FormsModule, RouterLink, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent implements OnInit, AfterViewInit {

  title = 'Students';

  studentList: Student[] = [];
  filteredList: Student[] = [];

  searchTerm: string = '';
  filterClass: string = '';
  filterSection: string = '';
  filterStatus: string = '';
  defaultImage = 'assets/images/user-grid/user-grid-img2.png';
  studentToDelete: Student | null = null;

  classes = ['Nursery', 'Prep', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  sections = ['A', 'B', 'C', 'D'];

  constructor(private studentService: StudentService) {}

  ngOnInit(): void {
    this.loadStudents();
  }

  // -------------------------------------------------------
  // Fetch Students From API
  // -------------------------------------------------------
  loadStudents() {
    this.studentService.GetStudents().subscribe({
      next: (res) => {
        this.studentList = res;
        this.applyFilters();
      },
      error: (err) => {
        console.error("Error loading students:", err);
      }
    });
  }

  // -------------------------------------------------------
  // Centralized Filtering
  // -------------------------------------------------------
  applyFilters() {
    let list = [...this.studentList];

    if (this.filterClass) {
      list = list.filter(s => String(s.standardId) === this.filterClass);
    }

    if (this.filterSection) {
      list = list.filter(s => s.section?.toLowerCase() === this.filterSection.toLowerCase());
    }

    if (this.filterStatus) {
      list = list.filter(s => s.status?.toLowerCase() === this.filterStatus.toLowerCase());
    }

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      list = list.filter(s =>
        s.studentName.toLowerCase().includes(search) ||
        s.admissionNo?.toString().includes(search) ||
        s.enrollmentNo?.toString().includes(search)
      );
    }

    this.filteredList = list;
  }

  // -------------------------------------------------------
  // Delete Confirmation
  // -------------------------------------------------------
  confirmDelete(student: Student) {
    this.studentToDelete = student;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
  }

  // -------------------------------------------------------
  // Delete Student (API)
  // -------------------------------------------------------
  deleteStudent() {
    if (!this.studentToDelete) return;

    this.studentService.DeleteStudent(this.studentToDelete.studentId).subscribe({
      next: () => {
        this.studentList = this.studentList.filter(
          s => s.studentId !== this.studentToDelete!.studentId
        );
        this.applyFilters();

        const modalEl = document.getElementById('deleteModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        modal.hide();

        this.studentToDelete = null;
      },
      error: (err) => {
        console.error("Delete error:", err);
      }
    });
  }

  // -------------------------------------------------------
  // Convert Base64 Image
  // -------------------------------------------------------
getStudentImage(student: any): string {
  if (student.imageUpload && student.imageUpload.imageData) {
    return student.imageUpload.imageData;  
  }
  return 'assets/images/user-grid/user-grid-img2.png';
}


  ngAfterViewInit(): void {}
}