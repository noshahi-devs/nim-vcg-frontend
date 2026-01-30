import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamService, Exam } from '../../../services/exam.service';
import { finalize } from 'rxjs/operators';

interface AnalyticsData {
  totalStudents: number;
  passedStudents: number;
  failedStudents: number;
  passPercentage?: number;
  averagePercentage: number;
  highestMarks?: number;
  lowestMarks?: number;
  gradeDistribution?: { grade: string; count: number; percentage: number }[];
  subjectPerformance?: { subject: string; average: number; highest: number; lowest: number }[];
}

@Component({
  selector: 'app-exam-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './exam-analytics.component.html',
  styleUrl: './exam-analytics.component.css'
})
export class ExamAnalyticsComponent implements OnInit {
  title = 'Exam Analytics';

  loading = false;
  selectedExamId: number = 0;
  selectedClassId: number = 0;

  exams: Exam[] = [];
  classes = [
    { id: 1, name: 'Class 10' },
    { id: 2, name: 'Class 9' },
    { id: 3, name: 'Class 8' }
  ];

  analyticsData: AnalyticsData = {
    totalStudents: 0,
    passedStudents: 0,
    failedStudents: 0,
    passPercentage: 0,
    averagePercentage: 0,
    highestMarks: 0,
    lowestMarks: 0,
    gradeDistribution: [],
    subjectPerformance: []
  };

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

  loadAnalytics() {
    if (!this.selectedExamId) {
      return;
    }

    this.loading = true;
    this.examService
      .getExamAnalytics(this.selectedExamId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.analyticsData = res;
        },
        error: (err) => {
          console.error('Error fetching analytics:', err);
          this.loadMockAnalytics();
        }
      });
  }

  loadMockAnalytics() {
    this.analyticsData = {
      totalStudents: 50,
      passedStudents: 42,
      failedStudents: 8,
      passPercentage: 84,
      averagePercentage: 76.5,
      highestMarks: 485,
      lowestMarks: 245,
      gradeDistribution: [
        { grade: 'A+', count: 8, percentage: 16 },
        { grade: 'A', count: 12, percentage: 24 },
        { grade: 'B', count: 15, percentage: 30 },
        { grade: 'C', count: 7, percentage: 14 },
        { grade: 'D', count: 0, percentage: 0 },
        { grade: 'F', count: 8, percentage: 16 }
      ],
      subjectPerformance: [
        { subject: 'Mathematics', average: 78, highest: 98, lowest: 45 },
        { subject: 'English', average: 75, highest: 95, lowest: 50 },
        { subject: 'Science', average: 82, highest: 99, lowest: 55 },
        { subject: 'Urdu', average: 74, highest: 92, lowest: 48 },
        { subject: 'Islamiat', average: 85, highest: 100, lowest: 60 }
      ]
    };
  }

  onExamChange() {
    if (this.selectedExamId) {
      this.loadAnalytics();
    }
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

  getProgressBarClass(average: number): string {
    if (average >= 80) return 'bg-success-600';
    if (average >= 70) return 'bg-info-600';
    if (average >= 60) return 'bg-warning-600';
    if (average >= 50) return 'bg-orange-600';
    return 'bg-danger-600';
  }
}