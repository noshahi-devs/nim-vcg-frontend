import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';

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
import { finalize, forkJoin } from 'rxjs';


declare var bootstrap: any;

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [FormsModule, RouterLink, CommonModule],
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

  get totalStudents(): number { return this.studentList.length; }
  get activeStudents(): number { return this.studentList.filter(s => s.status?.toLowerCase() === 'active').length; }
  get inactiveStudents(): number { return this.studentList.filter(s => s.status?.toLowerCase() === 'inactive').length; }


  constructor(
    private studentService: StudentService,
    private standardService: StandardService,
    private sectionService: SectionService,
    public authService: AuthService,
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
    forkJoin({
      students: this.studentService.GetStudents(),
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

  // -------------------------------------------------------
  // Centralized Filtering
  // -------------------------------------------------------
  applyFilters() {
    let list = [...this.studentList];

    if (this.filterClass) {
      list = list.filter(s => String(s.standardId) === this.filterClass);
    }

    if (this.filterSection) {
      list = list.filter(s =>
        s.section?.toLowerCase() === this.filterSection.toLowerCase() ||
        s.section === this.filterSection ||
        ((!s.section || s.section.trim() === '') && (this.filterSection === 'A' || this.filterSection.includes('Section A'))) ||
        this.sectionList.find(sec => sec.sectionName === this.filterSection)?.sectionCode === s.section
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
}
