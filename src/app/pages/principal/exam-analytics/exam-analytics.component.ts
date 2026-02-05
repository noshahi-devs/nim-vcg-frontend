import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExamService, ExamAnalytics, Exam } from '../../../services/exam.service';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-exam-analytics',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './exam-analytics.component.html',
  styles: [`:host { display: block; }`]
})
export class ExamAnalyticsComponent implements OnInit {
  analytics: ExamAnalytics | null = null;
  exams: Exam[] = [];
  selectedExamId: number | null = null;
  isLoading: boolean = false;

  constructor(private examService: ExamService) { }

  ngOnInit(): void {
    this.loadExams();
  }

  loadExams(): void {
    this.examService.getAllExams().subscribe(data => this.exams = data);
  }

  loadAnalytics(): void {
    if (!this.selectedExamId) return;
    this.isLoading = true;
    this.examService.getExamAnalytics(this.selectedExamId).subscribe({
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
        this.isLoading = false;
      }
    });
  }
}