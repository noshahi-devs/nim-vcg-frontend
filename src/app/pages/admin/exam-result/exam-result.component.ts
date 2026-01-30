import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamService, ExamResult, Exam } from '../../../services/exam.service';
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
  loading = false;

  // Filters
  selectedExamId: number = 0;
  selectedStudentId: number = 0;
  selectedClassId: number = 0;
  selectedSectionId: number = 0;

  // Dropdown data
  exams: Exam[] = [];
  students = [
    { id: 1, name: 'Ahmed Ali', rollNo: '001' },
    { id: 2, name: 'Fatima Noor', rollNo: '002' },
    { id: 3, name: 'Hassan Khan', rollNo: '003' },
    { id: 4, name: 'Ayesha Malik', rollNo: '004' },
    { id: 5, name: 'Usman Tariq', rollNo: '005' }
  ];

  classes = [
    { id: 1, name: 'Class 10' },
    { id: 2, name: 'Class 9' },
    { id: 3, name: 'Class 8' }
  ];

  sections = [
    { id: 1, name: 'Section A' },
    { id: 2, name: 'Section B' },
    { id: 3, name: 'Section C' }
  ];

  // Summary data
  totalMarks: number = 0;
  obtainedMarks: number = 0;
  percentage: number = 0;
  overallGrade: string = '';
  resultStatus: string = '';

  constructor(private examService: ExamService) { }

  ngOnInit() {
    this.loadExams();
  }

  loadExams() {
    this.examService.getAllExams().subscribe({
      next: (res) => {
        this.exams = res || [];
      },
      error: (err) => {
        console.error('Error fetching exams:', err);
        this.exams = [
          {
            examId: 1,
            examName: 'Mid Term Exam 2024',
            examType: 'Term',
            classId: 1,
            sectionId: 1,
            startDate: '2024-03-15',
            endDate: '2024-03-25',
            status: 'Active'
          }
        ];
      }
    });
  }

  loadResults() {
    if (!this.selectedExamId || !this.selectedStudentId) {
      Swal.fire({
        icon: 'warning',
        title: 'Selection Required',
        text: 'Please select Exam and Student to view results'
      });
      return;
    }

    this.loading = true;
    this.examService
      .getResultByStudent(this.selectedStudentId, this.selectedExamId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          // If the API returns a single result with subjects array, use that
          // Otherwise fall back to mock data
          if (res && res.subjects && res.subjects.length > 0) {
            this.examResults = [res];
          } else {
            this.loadMockResults();
          }
          this.calculateSummary();
        },
        error: (err) => {
          console.error('Error fetching results:', err);
          this.loadMockResults();
        }
      });
  }

  loadMockResults() {
    this.examResults = [
      {
        resultId: 1,
        examId: this.selectedExamId,
        studentId: this.selectedStudentId,
        studentName: this.getStudentName(this.selectedStudentId),
        rollNo: this.getStudentRollNo(this.selectedStudentId),
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
        studentName: this.getStudentName(this.selectedStudentId),
        rollNo: this.getStudentRollNo(this.selectedStudentId),
        subjectId: 2,
        subjectName: 'English',
        totalMarks: 100,
        obtainedMarks: 78,
        grade: 'B',
        percentage: 78,
        isPassed: true
      },
      {
        resultId: 3,
        examId: this.selectedExamId,
        studentId: this.selectedStudentId,
        studentName: this.getStudentName(this.selectedStudentId),
        rollNo: this.getStudentRollNo(this.selectedStudentId),
        subjectId: 3,
        subjectName: 'Science',
        totalMarks: 100,
        obtainedMarks: 92,
        grade: 'A+',
        percentage: 92,
        isPassed: true
      },
      {
        resultId: 4,
        examId: this.selectedExamId,
        studentId: this.selectedStudentId,
        studentName: this.getStudentName(this.selectedStudentId),
        rollNo: this.getStudentRollNo(this.selectedStudentId),
        subjectId: 4,
        subjectName: 'Urdu',
        totalMarks: 100,
        obtainedMarks: 88,
        grade: 'A',
        percentage: 88,
        isPassed: true
      },
      {
        resultId: 5,
        examId: this.selectedExamId,
        studentId: this.selectedStudentId,
        studentName: this.getStudentName(this.selectedStudentId),
        rollNo: this.getStudentRollNo(this.selectedStudentId),
        subjectId: 5,
        subjectName: 'Islamiat',
        totalMarks: 100,
        obtainedMarks: 95,
        grade: 'A+',
        percentage: 95,
        isPassed: true
      }
    ];
    this.calculateSummary();
  }

  calculateSummary() {
    this.totalMarks = this.examResults.reduce((sum, r) => sum + r.totalMarks, 0);
    this.obtainedMarks = this.examResults.reduce((sum, r) => sum + r.obtainedMarks, 0);
    this.percentage = this.totalMarks > 0 ? (this.obtainedMarks / this.totalMarks) * 100 : 0;
    this.overallGrade = this.examService.calculateGrade(this.percentage);
    this.resultStatus = this.examResults.every(r => r.isPassed) ? 'PASS' : 'FAIL';
  }

  onFilterChange() {
    if (this.selectedExamId && this.selectedStudentId) {
      this.loadResults();
    }
  }

  printResult() {
    window.print();
  }

  downloadPDF() {
    Swal.fire({
      icon: 'info',
      title: 'Download PDF',
      text: 'PDF download functionality will be implemented'
    });
  }

  getStudentName(studentId: number): string {
    return this.students.find(s => s.id === studentId)?.name || '';
  }

  getStudentRollNo(studentId: number): string {
    return this.students.find(s => s.id === studentId)?.rollNo || '';
  }

  getGradeBadgeClass(grade: string): string {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-success-focus text-success-600 border border-success-main';
      case 'B':
        return 'bg-info-focus text-info-600 border border-info-main';
      case 'C':
        return 'bg-warning-focus text-warning-600 border border-warning-main';
      case 'D':
        return 'bg-orange-focus text-orange-600 border border-orange-main';
      case 'F':
        return 'bg-danger-focus text-danger-600 border border-danger-main';
      default:
        return 'bg-neutral-200 text-neutral-600';
    }
  }

  getResultStatusClass(): string {
    return this.resultStatus === 'PASS'
      ? 'bg-success-focus text-success-600 border border-success-main'
      : 'bg-danger-focus text-danger-600 border border-danger-main';
  }
}