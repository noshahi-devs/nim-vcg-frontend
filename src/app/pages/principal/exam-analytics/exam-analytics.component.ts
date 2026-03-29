import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamService, ExamAnalytics, Exam } from '../../../services/exam.service';
import { StandardService } from '../../../services/standard.service';
import { SectionService } from '../../../services/section.service';
import { Standard } from '../../../Models/standard';
import { Section } from '../../../Models/section';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

@Component({
  selector: 'app-exam-analytics',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  templateUrl: './exam-analytics.component.html',
  styleUrl: './exam-analytics.component.css'
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

  // Modals handled by PopupService
  isProcessing = false;

  constructor(
    private examService: ExamService,
    private standardService: StandardService,
    private sectionService: SectionService,
    private popup: PopupService
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
        this.exams = (res || []).map(e => ({
          ...e,
          examId: e.examScheduleId || e.id,
          examName: e.examScheduleName || e.name || e.examName
        }));
      },
      error: (err) => {
        console.error('Failed to load exams', err);
        this.exams = [];
      }
    });
  }

  loadClasses() {
    this.standardService.getStandards().subscribe({
      next: (res) => {
        this.classes = res || [];
      },
      error: (err) => {
        console.error('Failed to load classes', err);
        this.classes = [];
      }
    });
  }

  onClassChange() {
    this.selectedSectionId = null;
    this.sections = [];
    this.analytics = null;

    if (this.selectedClassId) {
      const selectedClass = this.classes.find(c => c.standardId == this.selectedClassId);
      if (selectedClass) {
        this.sections = this.allSections.filter(s => s.className === selectedClass.standardName);
      }
    }
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    if (!this.selectedExamId) return;
    
    this.popup.loading('Analyzing exam performance...');
    this.isLoading = true;
    this.isProcessing = true;

    const classId = this.selectedClassId ? (this.selectedClassId as any) : undefined;
    const sectionId = this.selectedSectionId ? (this.selectedSectionId as any) : undefined;

    this.examService.getExamAnalytics(this.selectedExamId, classId, sectionId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.isProcessing = false;
          this.popup.closeLoading();
        })
      )
      .subscribe({
        next: (data: any) => {
          if (data && data.success === false) {
            this.analytics = null;
            this.popup.warning('Could not generate analytics for the selected criteria.', 'No Data');
            return;
          }
          this.analytics = data;
          if (!data || data.totalStudents === 0) {
            this.popup.warning('No records found to analyze for this selection.', 'Empty Results');
          }
        },
        error: (err) => {
          console.error('Failed to load analytics', err);
          this.analytics = null;
          this.popup.error('Error', 'Failed to calculate analytics data.');
        }
      });
  }
}
