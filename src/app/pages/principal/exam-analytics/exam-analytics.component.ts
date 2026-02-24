import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamService, ExamAnalytics, Exam } from '../../../services/exam.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-exam-analytics',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent],
  templateUrl: './exam-analytics.component.html',
  styleUrls: ['./exam-analytics.component.css']
})
export class ExamAnalyticsComponent implements OnInit {
  title = 'Exam Analytics';
  analytics: ExamAnalytics | null = null;
  exams: Exam[] = [];
  classes: Standard[] = [];
  sections: Section[] = [];

  selectedExamId: number | null = null;
  selectedClassId: number | null = null;
  selectedSectionId: number | null = null;

  allSections: any[] = [];
  isLoading: boolean = false;

  constructor(
    private examService: ExamService,
    private standardService: StandardService,
    private sectionService: SectionService
  ) { }

  ngOnInit(): void {
    this.loadExams();
    this.loadClasses();
    this.loadAllSections();
  }

  loadAllSections() {
    this.sectionService.getSections().subscribe({
      next: (res) => {
        this.allSections = res || [];
      },
      error: (err) => {
        console.error('Failed to load sections', err);
      }
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
      { standardId: 1, standardName: 'Class One' },
      { standardId: 2, standardName: 'Class Two' },
      { standardId: 3, standardName: 'Class Three' }
    ] as any;
  }

  onClassChange() {
    this.selectedSectionId = null;
    this.sections = [];
    this.analytics = null; // reset analytics when class changes

    if (this.selectedClassId) {
      // Find the class name to filter sections
      const selectedClass = this.classes.find(c => c.standardId == this.selectedClassId);
      if (selectedClass) {
        this.sections = this.allSections.filter(s => s.className === selectedClass.standardName);
      }

      if (this.sections.length === 0) {
        this.loadMockSections();
      }
    }
    this.loadAnalytics();
  }

  loadMockSections() {
    this.sections = [
      { sectionId: 1, sectionName: 'A', className: 'Class One' },
      { sectionId: 2, sectionName: 'B', className: 'Class One' }
    ] as any;
  }

  loadAnalytics(): void {
    if (!this.selectedExamId) return;
    this.isLoading = true;

    // Provide 0 or undefined for optional class/section parameters if they are null
    const classId = this.selectedClassId ? this.selectedClassId : undefined;
    const sectionId = this.selectedSectionId ? this.selectedSectionId : undefined;

    this.examService.getExamAnalytics(this.selectedExamId, classId, sectionId).subscribe({
      next: (data) => {
        this.analytics = data;
        this.isLoading = false;
      },
      error: () => {
        // Dummy Data for Demo
        this.analytics = {
          examName: 'Mid Term 2024',
          totalStudents: 120,
          passedStudents: 100,
          failedStudents: 20,
          passPercentage: 83.3,
          averagePercentage: 75,
          highestMarks: 98,
          lowestMarks: 35,
          topPerformer: 'John Doe',
          gradeDistribution: [
            { grade: 'A', count: 40, percentage: 33 },
            { grade: 'B', count: 40, percentage: 33 },
            { grade: 'C', count: 20, percentage: 16 },
            { grade: 'F', count: 20, percentage: 16 }
          ],
          subjectWiseAnalytics: [
            { subjectName: 'Math', averageMarks: 70, highestMarks: 95, lowestMarks: 40, passPercentage: 90 },
            { subjectName: 'English', averageMarks: 80, highestMarks: 90, lowestMarks: 50, passPercentage: 95 }
          ]
        };

        // Slightly randomize dummy data based on class selection to make it feel "interactive"
        if (this.selectedClassId) {
          this.analytics.totalStudents = 40;
          this.analytics.passedStudents = 35;
          this.analytics.failedStudents = 5;
          this.analytics.passPercentage = 87.5;
          this.analytics.averagePercentage = 78;
        }

        this.isLoading = false;
      }
    });
  }
}
