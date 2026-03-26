import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../../services/student.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SubjectAssignmentService, SubjectAssignment } from '../../../core/services/subject-assignment.service';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { SessionService } from '../../../services/session.service';
import { Action } from 'rxjs/internal/scheduler/Action';
import { AcademicYear } from '../../../Models/academic-year';
import { environment } from '../../../../environments/environment';


declare var bootstrap: any;

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule, BreadcrumbComponent],
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

  classList: Standard[] = [];
  sectionList: Section[] = [];

  // Teacher specific context
  isTeacher = false;
  staffId: number | null = null;
  assignedSections: Section[] = [];
  assignedClassNames: string[] = [];
  loading = false;
  Math = Math;

  // Pagination
  currentPage = 1;
  rowsPerPage = 12;

  academicYears: AcademicYear[] = [];
  selectedYearId: number | null = null;
  private sessionSubscription?: Subscription;
  private yearsSubscription?: Subscription;

  // Premium Modal Visibility State
  showConfirmDelete = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isDeleting = false;

  get totalStudents(): number { return this.studentList.length; }
  get activeStudents(): number { return this.studentList.filter(s => s.status?.toLowerCase() === 'active').length; }
  get inactiveStudents(): number { return this.studentList.filter(s => s.status?.toLowerCase() === 'inactive').length; }

  get yearDisplayName(): string {
    if (!this.selectedYearId) return 'Registry';
    const year = this.academicYears.find(y => y.academicYearId === Number(this.selectedYearId));
    return year ? year.name : 'Unknown Year';
  }

  get visibleSections(): Section[] {
    if (!this.filterClass) return this.sectionList;
    const selectedClass = this.classList.find(c => String(c.standardId) === this.filterClass);
    if (!selectedClass) return this.sectionList;
    // Filter by matching class name
    return this.sectionList.filter(s => s.className === selectedClass.standardName);
  }


  constructor(
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService,
    public authService: AuthService,
    private staffService: StaffService,
    private assignmentService: SubjectAssignmentService,
    private sessionService: SessionService
  ) { }


  ngOnInit(): void {
    // Initial sync with session
    this.selectedYearId = this.sessionService.getCurrentYearId();

    this.sessionSubscription = this.sessionService.currentYear$.subscribe(year => {
      if (year) {
        this.selectedYearId = year.academicYearId;
        this.checkTeacherContext();
      }
    });

    this.yearsSubscription = this.sessionService.allYears$.subscribe(years => {
      this.academicYears = years;
      // If we have years but no selection (or selection is weirdly old), try to pick best one
      if (this.academicYears.length > 0 && (!this.selectedYearId || this.yearDisplayName.includes('2001'))) {
        const currentYear = new Date().getFullYear().toString();
        const found = this.academicYears.find(y => y.name.includes(currentYear)) ||
          [...this.academicYears].sort((a, b) => b.academicYearId - a.academicYearId)[0];
        if (found && found.academicYearId !== this.selectedYearId) {
          this.selectedYearId = found.academicYearId;
          this.checkTeacherContext();
        }
      }
    });
  }

  private checkTeacherContext() {
    this.loading = true;
    const roles: string[] = this.authService.roles || [];
    this.isTeacher = roles.some(r => r.toLowerCase() === 'teacher');
    const currentUser = this.authService.userValue;

    if (this.isTeacher && currentUser?.email) {
      // Find staffId by email
      this.staffService.getAllStaffs().subscribe({
        next: (staffs) => {
          const staff = staffs.find(s => s.email?.toLowerCase() === currentUser.email?.toLowerCase());
          if (staff) {
            this.staffId = staff.staffId;
            this.loadTeacherAssignments();
          } else {
            console.error("Teacher account not linked to any staff record.");
            this.loadAllData();
          }
        },
        error: (err) => {
          console.error("Error fetching staff for teacher lookup:", err);
          this.loadAllData();
        }
      });
    } else {
      this.loadAllData();
    }
  }

  private loadTeacherAssignments() {
    if (!this.staffId) {
      this.loadAllData();
      return;
    }

    forkJoin({
      sections: this.sectionService.getSections(),
      assignments: this.assignmentService.getAssignmentsByTeacher(this.staffId)
    }).subscribe({
      next: (res) => {
        const classTeacherSections = res.sections.filter(s => s.staffId === this.staffId);
        const assignedSectionIds = res.assignments.map(a => a.sectionId);
        const subjectSections = res.sections.filter(s => assignedSectionIds.includes(s.sectionId));

        // Combine sections uniquely
        const uniqueSections = new Map<number, Section>();
        classTeacherSections.forEach(s => uniqueSections.set(s.sectionId, s));
        subjectSections.forEach(s => uniqueSections.set(s.sectionId, s));

        this.assignedSections = Array.from(uniqueSections.values());
        this.assignedClassNames = [...new Set(this.assignedSections.map(s => s.className))];
        this.loadAllData();
      },
      error: (err) => {
        console.error("Error loading teacher assignments:", err);
        this.loadAllData();
      }
    });
  }

  private loadAllData() {
    const yearId = this.selectedYearId;
    forkJoin({
      students: this.studentService.GetStudents(yearId),
      classes: this.standardService.getStandards(),
      sections: this.sectionService.getSections()
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => {
        this.studentList = res.students;
        this.classList = res.classes;
        this.sectionList = res.sections;

        if (this.isTeacher) {
          this.applyTeacherFiltering();
        }

        this.applyFilters();
      }
    });
  }

  private applyTeacherFiltering() {
    // 1. Filter section dropdown to only assigned sections (Unique by name)
    const uniqueSecs = new Map<string, Section>();
    this.assignedSections.forEach(s => uniqueSecs.set(s.sectionName, s));
    this.sectionList = Array.from(uniqueSecs.values());

    // 2. Filter class dropdown to only classes that have assigned sections
    this.classList = this.classList.filter(c => this.assignedClassNames.includes(c.standardName));

    // 3. Filter student list to only those in assigned sections
    this.studentList = this.studentList.filter(s =>
      this.assignedSections.some(sec =>
        (sec.className === this.getClassName(s.standardId)) &&
        (sec.sectionCode === s.section || sec.sectionName === s.section ||
          ((!s.section || s.section.trim() === '') && sec.sectionCode === 'A'))
      )
    );
  }


  // -------------------------------------------------------
  // Fetch Students From API
  // -------------------------------------------------------
  loadStudents() {
    const yearId = this.sessionService.getCurrentYearId();
    this.studentService.GetStudents(yearId).subscribe({
      next: (res) => {
        this.studentList = res;
        this.applyFilters();
      },
      error: (err) => {
        console.error("Error loading students:", err);
      }
    });
  }

  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (res) => {
        this.classList = res;
      },
      error: (err) => {
        console.error("Error loading classes:", err);
      }
    });
  }

  loadSections() {
    this.sectionService.getSections().subscribe({
      next: (res) => {
        this.sectionList = res;
      },
      error: (err) => {
        console.error("Error loading sections:", err);
      }
    });
  }

  onYearChange() {
    this.loading = true;
    this.loadAllData();
  }

  onClassChange() {
    this.filterSection = ''; // Reset section when class changes
    this.applyFilters();
  }

  // ── Premium Feedback ──
  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string, autoClose = false) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
    if (autoClose) {
      setTimeout(() => {
        this.showFeedbackModal = false;
      }, 2200);
    }
  }

  closeFeedback() {
    this.showFeedbackModal = false;
  }

  // -------------------------------------------------------
  // Centralized Filtering
  // -------------------------------------------------------
  applyFilters() {
    let list = [...this.studentList];

    if (this.filterClass) {
      const classId = Number(this.filterClass);
      list = list.filter(s => Number(s.standardId) === classId);
    }

    if (this.filterSection) {
      const sectionId = Number(this.filterSection);
      list = list.filter(s =>
        Number(s.sectionId) === sectionId ||
        // Fallback for legacy data using section name comparison
        (this.sectionList.find(sec => sec.sectionId === sectionId)?.sectionName === s.section)
      );
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
    this.currentPage = 1;
  }

  get paginatedStudentList(): Student[] {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    return this.filteredList.slice(start, start + this.rowsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredList.length / this.rowsPerPage);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // -------------------------------------------------------
  // Delete Confirmation
  // -------------------------------------------------------
  confirmDelete(student: Student) {
    this.studentToDelete = student;
    this.showConfirmDelete = true;
  }

  cancelDelete() {
    this.showConfirmDelete = false;
    this.studentToDelete = null;
  }

  // -------------------------------------------------------
  // Delete Student (API)
  // -------------------------------------------------------
  deleteStudent() {
    if (!this.studentToDelete) return;

    this.isDeleting = true;
    this.studentService.DeleteStudent(this.studentToDelete.studentId).pipe(
      finalize(() => {
        this.isDeleting = false;
        this.showConfirmDelete = false;
      })
    ).subscribe({
      next: () => {
        const name = this.studentToDelete?.studentName;
        this.studentList = this.studentList.filter(
          s => s.studentId !== this.studentToDelete!.studentId
        );
        this.applyFilters();
        this.studentToDelete = null;
        this.showFeedback('success', 'Student Deleted', `<strong>${name}</strong> has been removed from the records.`, true);
      },
      error: (err) => {
        console.error("Delete error:", err);
        let errorMsg = 'Unable to delete student. They might have active academic, attendance, or financial records.';

        if (err.error && typeof err.error === 'string') {
          errorMsg = err.error;
        } else if (err.error?.message) {
          errorMsg = err.error.message;
        }

        // Sanitize technical error messages (stack traces)
        if (errorMsg.includes('Microsoft.EntityFrameworkCore') || errorMsg.includes('SqlException') || errorMsg.includes('Database error')) {
          errorMsg = 'This student record is currently linked to other data (like Marks, Attendance, or Fees) and cannot be removed until those records are deleted first.';
        }

        this.showFeedback('error', 'Deletion Failed', errorMsg);
      }
    });
  }

  // -------------------------------------------------------
  // Convert Base64 Image
  // -------------------------------------------------------
  getStudentImage(student: any): string {
    // 1. Check if we have a base64 image (unsaved upload or preview)
    if (student.imageUpload && student.imageUpload.imageData) {
      return student.imageUpload.imageData;
    }

    // 2. Check if we have a saved path from the server
    if (student.imagePath) {
      // If it's already a full URL or base64, return as is
      if (student.imagePath.startsWith('http') || student.imagePath.startsWith('data:')) {
        return student.imagePath;
      }
      // Otherwise prepend API base URL
      const normalizedPath = student.imagePath.replace(/\\/g, '/');
      return `${environment.apiBaseUrl}/${normalizedPath}`;
    }

    // 3. Fallback to default
    return 'assets/images/user-grid/user-grid-img2.png';
  }

  // -------------------------------------------------------
  // Get Class Name by ID
  // -------------------------------------------------------
  getClassName(id: number | null): string {
    if (!id) return 'N/A';
    const standard = this.classList.find(c => c.standardId === id);
    return standard ? standard.standardName : `Class ${id}`;
  }


  // -------------------------------------------------------
  // Get Class & Section String (e.g., "Class 4 Section A")
  // -------------------------------------------------------
  getStudentDisplay(student: Student): string {
    let className = this.getClassName(student.standardId);

    // Convert "Class One", "Class Two", etc. to "Class 1", "Class 2"
    const numberMap: { [key: string]: string } = {
      'One': '1', 'Two': '2', 'Three': '3', 'Four': '4', 'Five': '5',
      'Six': '6', 'Seven': '7', 'Eight': '8', 'Nine': '9', 'Ten': '10'
    };

    Object.keys(numberMap).forEach(word => {
      if (className.includes(word)) {
        className = className.replace(word, numberMap[word]);
      }
    });

    let section = student.section;
    // For teachers, if section is null, assume the assigned section (usually 'A')
    if (this.isTeacher && (!section || section.trim() === '')) {
      const assigned = this.assignedSections.find(sec => sec.className === this.getClassName(student.standardId));
      if (assigned) {
        section = assigned.sectionCode || 'A';
      }
    }

    return section ? `${className} Section ${section}` : className;
  }


  ngAfterViewInit(): void { }

  ngOnDestroy(): void {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }
    if (this.yearsSubscription) {
      this.yearsSubscription.unsubscribe();
    }
  }
}
