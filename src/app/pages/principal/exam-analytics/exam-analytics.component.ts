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
    this.isLoading = true;

    const classId = this.selectedClassId ? this.selectedClassId : undefined;
    const sectionId = this.selectedSectionId ? this.selectedSectionId : undefined;

    this.examService.getExamAnalytics(this.selectedExamId, classId, sectionId).subscribe({
      next: (data: any) => {
        if (data.success === false) {
          this.analytics = null;
          this.isLoading = false;
          return;
        }
        this.analytics = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load analytics', err);
        this.analytics = null;
        this.isLoading = false;
      }
    });
  }
}
