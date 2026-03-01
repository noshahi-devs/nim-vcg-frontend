import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamService, ExamResult, Exam } from '../../../services/exam.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { StudentService } from '../../../services/student.service';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { Student } from '../../../Models/student';
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../SecurityModels/auth.service';
import { StaffService } from '../../../services/staff.service';
import { SubjectAssignmentService, SubjectAssignment } from '../../../core/services/subject-assignment.service';
import { Staff } from '../../../Models/staff';

@Component({
  selector: 'app-exam-result',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './exam-result.component.html',
  styleUrl: './exam-result.component.css'
})
export class ExamResultComponent implements OnInit {
  title = 'Exam Results';

  examResults: ExamResult[] = [];
  displayResults: any[] = [];
  loading = false;

  // Filters
  selectedExamId: number = 0;
  selectedStudentId: number = 0;
  selectedClassId: number = 0;
  selectedSectionId: number = 0;

  // Real data
  exams: Exam[] = [];
  classes: Standard[] = [];
  sections: Section[] = [];
  students: Student[] = [];
  filteredStudents: Student[] = [];

  // Summary data
  totalMarks: number = 0;
  obtainedMarks: number = 0;
  percentage: number = 0;
  overallGrade: string = '';
  resultStatus: string = '';

  constructor(
    private examService: ExamService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private studentService: StudentService,
    private authService: AuthService,
    private staffService: StaffService,
    private assignmentService: SubjectAssignmentService
  ) { }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadExams();

    const isTeacher = this.authService.hasAnyRole(['Teacher']);
    const currentUser = this.authService.userValue;

    if (isTeacher && currentUser?.email) {
      this.staffService.getStaffByEmail(currentUser.email).subscribe({
        next: (staff: Staff) => {
          this.currentStaffId = staff.staffId;
          this.loadTeacherAssignments(staff.staffId);
        },
        error: () => this.loadClasses()
      });
    } else {
      this.loadClasses();
    }
  }

  currentStaffId: number | null = null;
  assignedSections: SubjectAssignment[] = [];
  assignedClassNames: string[] = [];

  loadTeacherAssignments(staffId: number): void {
    forkJoin({
      allClasses: this.standardService.getStandards(),
      assignments: this.assignmentService.getAssignmentsByTeacher(staffId),
      sections: this.sectionService.getSections()
    }).subscribe({
      next: (result) => {
        // Sections where staff is Class Teacher
        const classTeacherSections = (result.sections || []).filter(s => s.staffId === staffId);

        // Combine with subject assignments
        const allAssignedSections = [
          ...classTeacherSections.map(s => ({ sectionId: s.sectionId, sectionName: s.sectionName, className: s.className })),
          ...(result.assignments || []).map(a => ({
            sectionId: a.sectionId,
            sectionName: a.section?.sectionName,
            className: a.section?.className || a.subject?.standard?.standardName
          }))
        ];

        // Unique classes
        this.assignedClassNames = [...new Set(allAssignedSections.map(s => s.className).filter(name => !!name))];
        this.classes = (result.allClasses || []).filter(c => this.assignedClassNames.includes(c.standardName));

        // Store for section filtering
        this.assignedSections = result.assignments || [];
      },
      error: () => this.loadClasses()
    });
  }

  loadExams() {
    this.examService.getAllExams().subscribe({
      next: (res: any[]) => {
        // Map backend properties (examScheduleId/examScheduleName) to frontend model
        this.exams = (res || []).map(e => ({
          ...e,
          examId: e.examScheduleId || e.id,
          examName: e.examScheduleName || e.name || e.examName
        }));

        if (this.exams.length === 0) {
          this.loadMockExams();
        }
      },
      error: (err) => {
        console.error('Failed to load exams', err);
        this.loadMockExams();
      }
    });
  }

  loadMockExams() {
    this.exams = [
      {
        examId: 1,
        examName: 'First Term Exam 2024',
        examType: 'Term',
        classId: 1,
        sectionId: 1,
        startDate: '2024-03-10',
        endDate: '2024-03-25',
        status: 'Active'
      },
      {
        examId: 2,
        examName: 'Monthly Test April',
        examType: 'Monthly',
        classId: 1,
        sectionId: 1,
        startDate: '2024-04-15',
        endDate: '2024-04-18',
        status: 'Active'
      },
      {
        examId: 3,
        examName: 'Mid Term Exam 2024',
        examType: 'Term',
        classId: 2,
        sectionId: 2,
        startDate: '2024-06-10',
        endDate: '2024-06-25',
        status: 'Active'
      }
    ];
  }

  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (res) => {
        this.classes = res || [];
        if (this.classes.length === 0) {
          this.loadMockClasses();
        }
      },
      error: (err) => {
        console.error('Failed to load classes', err);
        this.loadMockClasses();
      }
    });
  }

  loadMockClasses() {
    this.classes = [
      { standardId: 1, standardName: 'Class 1' },
      { standardId: 2, standardName: 'Class 2' },
      { standardId: 3, standardName: 'Class 3' }
    ] as any;
  }

  onClassChange() {
    this.selectedSectionId = 0;
    this.selectedStudentId = 0;
    this.sections = [];
    this.students = [];
    this.filteredStudents = [];
    this.examResults = [];

    if (this.selectedClassId) {
      const selectedClass = this.classes.find(c => c.standardId === this.selectedClassId);

      this.sectionService.getSections().subscribe({
        next: (res) => {
          const allSections = res || [];
          if (this.authService.hasAnyRole(['Teacher'])) {
            this.sections = allSections.filter(s =>
              s.className === selectedClass?.standardName &&
              (s.staffId === this.currentStaffId ||
                this.assignedSections.some(a => a.sectionId === s.sectionId))
            );
          } else {
            this.sections = allSections.filter(s => s.className === selectedClass?.standardName);
          }
          if (this.sections.length === 0 && !res) this.loadMockSections();
        },
        error: (err) => {
          console.error('Failed to load sections', err);
          this.loadMockSections();
        }
      });

      this.loadStudentsByClass();
    }
  }

  loadMockSections() {
    this.sections = [
      { sectionId: 1, sectionName: 'A' },
      { sectionId: 2, sectionName: 'B' }
    ] as any;
  }

  loadStudentsByClass() {
    this.studentService.GetStudents().subscribe({
      next: (res) => {
        const allStudents = res || [];
        if (this.authService.hasAnyRole(['Teacher'])) {
          this.students = allStudents.filter(s => s.standardId === this.selectedClassId);
          // Further filter by assigned sections if section is selected
          this.filterStudents();
        } else {
          this.students = allStudents.filter(s => s.standardId === this.selectedClassId);
          this.filterStudents();
        }
      },
      error: (err) => {
        console.error('Failed to load students', err);
        this.loadMockStudents();
        this.filterStudents();
      }
    });
  }

  loadMockStudents() {
    this.students = [
      { studentId: 1, studentName: 'Ali Khan', standardId: 1, sectionId: 1, admissionNo: '1001' },
      { studentId: 2, studentName: 'Sara Ahmed', standardId: 1, sectionId: 2, admissionNo: '1002' },
      { studentId: 3, studentName: 'Omar Farooq', standardId: 2, sectionId: 1, admissionNo: '1003' },
      { studentId: 4, studentName: 'Zainab Bibi', standardId: 2, sectionId: 2, admissionNo: '1004' }
    ] as any;
  }

  filterStudents() {
    this.filteredStudents = this.students;
    // Apply further filtering based on selectedSectionId if applicable
  }

  onSectionChange() {
    this.selectedStudentId = 0;
    this.filterStudents();
  }

  loadResults() {
    if (!this.selectedExamId || !this.selectedStudentId) {
      Swal.fire({ icon: 'warning', title: 'Selection Required', text: 'Please select Exam and Student.' });
      return;
    }

    this.loading = true;
    this.examService
      .getResultByStudent(this.selectedStudentId, this.selectedExamId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          if (res && res.subjects && res.subjects.length > 0) {
            // Normalize subjects
            this.displayResults = res.subjects.map(s => ({
              ...s,
              percentage: this.examService.calculatePercentage(s.obtainedMarks, s.totalMarks),
              isPassed: s.obtainedMarks >= (s.totalMarks * 0.5)
            }));
            this.examResults = [res];
          } else {
            this.loadMockResults();
          }
          this.calculateSummary();
        },
        error: () => {
          this.loadMockResults();
        }
      });
  }

  loadMockResults() {
    const student = this.filteredStudents.find(s => s.studentId === this.selectedStudentId);
    this.examResults = [
      {
        resultId: 1,
        examId: this.selectedExamId,
        studentId: this.selectedStudentId,
        studentName: student?.studentName || 'Student',
        rollNo: student?.admissionNo?.toString() || '000',
        subjectId: 1,
        subjectName: 'Mathematics',
        totalMarks: 100,
        obtainedMarks: 85,
        grade: 'A',
        percentage: 85,
        isPassed: true
      },
      {
        resultId: 2,
        examId: this.selectedExamId,
        studentId: this.selectedStudentId,
        studentName: student?.studentName || 'Student',
        rollNo: student?.admissionNo?.toString() || '000',
        subjectName: 'English',
        totalMarks: 100,
        obtainedMarks: 78,
        grade: 'B',
        percentage: 78,
        isPassed: true
      }
    ];
    this.displayResults = [...this.examResults];
    this.calculateSummary();
  }

  calculateSummary() {
    this.totalMarks = this.displayResults.reduce((sum, r) => sum + (r.totalMarks || 0), 0);
    this.obtainedMarks = this.displayResults.reduce((sum, r) => sum + (r.obtainedMarks || 0), 0);
    this.percentage = this.totalMarks > 0 ? (this.obtainedMarks / this.totalMarks) * 100 : 0;
    this.overallGrade = this.examService.calculateGrade(this.percentage);
    this.resultStatus = this.displayResults.every(r => r.isPassed) ? 'PASS' : 'FAIL';
  }

  printResult() { window.print(); }

  getGradeBadgeClass(grade: string): string {
    switch (grade) {
      case 'A+': case 'A': return 'bg-success-focus text-success-600 border border-success-main';
      case 'B': return 'bg-info-focus text-info-600 border border-info-main';
      case 'C': return 'bg-warning-focus text-warning-600 border border-warning-main';
      case 'D': return 'bg-orange-focus text-orange-600 border border-orange-main';
      case 'F': return 'bg-danger-focus text-danger-600 border border-danger-main';
      default: return 'bg-neutral-200 text-neutral-600';
    }
  }

  getResultStatusClass(): string {
    return this.resultStatus === 'PASS'
      ? 'bg-success-focus text-success-600 border border-success-main'
      : 'bg-danger-focus text-danger-600 border border-danger-main';
  }

  formatStandardName(name: string): string {
    if (!name) return '';
    const numberMap: { [key: string]: string } = {
      'One': '1', 'Two': '2', 'Three': '3', 'Four': '4', 'Five': '5',
      'Six': '6', 'Seven': '7', 'Eight': '8', 'Nine': '9', 'Ten': '10'
    };
    let formatted = name;
    Object.keys(numberMap).forEach(word => {
      if (formatted.includes(word)) {
        formatted = formatted.replace(word, numberMap[word]);
      }
    });
    return formatted;
  }
}
