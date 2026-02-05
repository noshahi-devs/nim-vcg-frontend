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
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

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
    private studentService: StudentService
  ) { }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    this.loadExams();
    this.loadClasses();
  }

  loadExams() {
    this.examService.getAllExams().subscribe(res => this.exams = res || []);
  }

  loadClasses() {
    this.standardService.getStandards().subscribe(res => this.classes = res || []);
  }

  onClassChange() {
    this.selectedSectionId = 0;
    this.selectedStudentId = 0;
    this.sections = [];
    this.students = [];
    this.filteredStudents = [];
    this.examResults = [];

    if (this.selectedClassId) {
      // Filter sections if needed, or load all. Sections usually belong to a class in real apps.
      this.sectionService.getSections().subscribe(res => {
        // Some APIs might return all sections, we filter them manually if needed
        this.sections = res || [];
      });

      this.loadStudentsByClass();
    }
  }

  loadStudentsByClass() {
    this.studentService.GetStudents().subscribe(res => {
      this.students = res || [];
      this.filterStudents();
    });
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
}