import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamService, Exam, ExamResult, SubjectResult } from '../../../services/exam.service';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize } from 'rxjs';

@Component({
    selector: 'app-student-exam-results',
    standalone: true,
    imports: [CommonModule, FormsModule, BreadcrumbComponent],
    templateUrl: './student-exam-results.component.html',
    styleUrl: './student-exam-results.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StudentExamResultsComponent implements OnInit {
    exams: Exam[] = [];
    selectedExamId: number = 0;
    result: ExamResult | null = null;
    displayResults: SubjectResult[] = [];

    loading = false;
    loadingExams = false;
    hasSearched = false;

    // Summary stats
    totalMarks = 0;
    obtainedMarks = 0;
    percentage = 0;
    overallGrade = '';
    status: 'Pass' | 'Fail' | 'N/A' = 'N/A';

    constructor(
        private examService: ExamService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadExams();
    }

    loadExams(): void {
        this.loadingExams = true;
        this.examService.getAllExams().subscribe({
            next: (res: any[]) => {
                // Map backend properties if necessary (consistency with Admin component)
                this.exams = (res || []).map(e => ({
                    ...e,
                    examId: e.examScheduleId || e.id || e.examId,
                    examName: e.examScheduleName || e.name || e.examName
                }));
                this.loadingExams = false;
            },
            error: (err) => {
                console.error('Failed to load exams', err);
                this.loadingExams = false;
            }
        });
    }

    onExamChange(): void {
        if (this.selectedExamId) {
            this.fetchResults();
        } else {
            this.resetResults();
        }
    }

    fetchResults(): void {
        const studentId = this.authService.userValue?.studentId;
        if (!studentId) {
            console.error('No student ID found for current user');
            return;
        }

        this.loading = true;
        this.hasSearched = true;
        this.examService.getResultByStudent(studentId, this.selectedExamId)
            .pipe(finalize(() => this.loading = false))
            .subscribe({
                next: (res) => {
                    if (res && res.subjects && res.subjects.length > 0) {
                        this.result = res;
                        this.displayResults = res.subjects;
                        this.calculateSummary();
                    } else {
                        this.resetResults();
                        this.hasSearched = true; // Keep true to show "No results"
                    }
                },
                error: (err) => {
                    console.error('Failed to fetch results', err);
                    this.resetResults();
                }
            });
    }

    private calculateSummary(): void {
        if (!this.displayResults || this.displayResults.length === 0) return;

        this.totalMarks = this.displayResults.reduce((sum, r) => sum + (r.totalMarks || 0), 0);
        this.obtainedMarks = this.displayResults.reduce((sum, r) => sum + (r.obtainedMarks || 0), 0);
        this.percentage = this.totalMarks > 0 ? (this.obtainedMarks / this.totalMarks) * 100 : 0;
        this.overallGrade = this.examService.calculateGrade(this.percentage);
        this.status = this.examService.determineStatus(this.percentage);
    }

    private resetResults(): void {
        this.result = null;
        this.displayResults = [];
        this.totalMarks = 0;
        this.obtainedMarks = 0;
        this.percentage = 0;
        this.overallGrade = '';
        this.status = 'N/A';
        this.hasSearched = false;
    }

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

    getStatusBadgeClass(): string {
        if (this.status === 'Pass') return 'bg-success-focus text-success-600 border border-success-main';
        if (this.status === 'Fail') return 'bg-danger-focus text-danger-600 border border-danger-main';
        return 'bg-neutral-200 text-neutral-600';
    }
}
