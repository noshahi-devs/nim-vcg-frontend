import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamService, GradeScale, Exam } from '../../../services/exam.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-auto-grade-calculation',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './auto-grade-calculation.component.html',
  styleUrl: './auto-grade-calculation.component.css'
})
export class AutoGradeCalculationComponent implements OnInit {
  title = 'Grade Scale Management';

  gradeScales: GradeScale[] = [];
  filteredGradeScales: GradeScale[] = [];
  paginatedGradeScales: GradeScale[] = [];

  searchTerm = '';
  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  loading = false;

  showAddEditDialog = false;
  showViewDialog = false;
  showDeleteDialog = false;
  isEditMode = false;
  selectedGradeScale: GradeScale | null = null;
  gradeScaleToDelete: GradeScale | null = null;

  gradeScaleForm: GradeScale = { grade: '', minPercentage: 0, maxPercentage: 0, gradePoint: 0, remarks: '' };
  Math = Math;

  exams: any[] = [];
  selectedGenerateExamId = 0;
  isGeneratingResult = false;

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';

  constructor(private examService: ExamService) { }

  ngOnInit() { this.loadGradeScales(); this.loadExams(); }

  // ── Helpers ──
  triggerSuccess(title: string, msg: string) {
    this.feedbackType = 'success'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerError(title: string, msg: string) {
    this.feedbackType = 'error'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerWarning(title: string, msg: string) {
    this.feedbackType = 'warning'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  closeFeedback() { this.showFeedbackModal = false; }

  loadExams() {
    this.examService.getAllExams().subscribe({
      next: (res: any[]) => {
        this.exams = (res || []).map(e => ({
          examId: e.examScheduleId || e.ExamScheduleId || e.examId || 0,
          examName: e.examScheduleName || e.ExamScheduleName || e.examName || 'Unknown Exam',
          examType: 'Term'
        }));
      },
      error: (err) => { console.error('Failed to load exams', err); this.exams = []; }
    });
  }

  generateExamResults() {
    if (!this.selectedGenerateExamId || this.selectedGenerateExamId === 0) {
      this.triggerError('Error', 'Please select an exam first.'); return;
    }
    const selectedExam = this.exams.find(e => e.examId === this.selectedGenerateExamId);
    this.isGeneratingResult = true;
    this.isProcessing = true;

    this.examService.generateResults(this.selectedGenerateExamId)
      .pipe(finalize(() => { this.isGeneratingResult = false; this.isProcessing = false; }))
      .subscribe({
        next: () => { this.triggerSuccess('Success!', 'Results have been generated and grades calculated successfully.'); },
        error: (err) => {
          console.error('Generation Error:', err);
          const errorMsg = err.error?.message || err.error || 'Check marks entry or grade scale settings.';
          this.triggerError('Calculation Failed', `Error: ${errorMsg}`);
        }
      });
  }

  loadGradeScales() {
    this.loading = true;
    this.examService.getAllGradeScales().pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => { this.gradeScales = res || []; this.filteredGradeScales = [...this.gradeScales]; this.updatePagination(); },
      error: (err) => { console.error('Error fetching grade scales:', err); this.gradeScales = []; this.filteredGradeScales = []; this.updatePagination(); }
    });
  }

  searchGradeScales() {
    const term = this.searchTerm.toLowerCase();
    this.filteredGradeScales = this.gradeScales.filter(g => g.grade.toLowerCase().includes(term) || g.remarks?.toLowerCase().includes(term));
    this.currentPage = 1; this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredGradeScales.length / this.rowsPerPage) || 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedGradeScales = this.filteredGradeScales.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) { this.currentPage = page; this.updatePagination(); }
  }

  openAddDialog() { this.resetForm(); this.isEditMode = false; this.showAddEditDialog = true; }
  openEditDialog(g: GradeScale) { this.gradeScaleForm = { ...g }; this.isEditMode = true; this.showAddEditDialog = true; }
  openViewDialog(g: GradeScale) { this.selectedGradeScale = g; this.showViewDialog = true; }

  closeDialog() { this.showAddEditDialog = false; this.showViewDialog = false; this.selectedGradeScale = null; }

  saveGradeScale() {
    if (!this.gradeScaleForm.grade || this.gradeScaleForm.minPercentage === undefined || this.gradeScaleForm.maxPercentage === undefined) {
      this.triggerError('Validation Error', 'Please fill all required fields'); return;
    }
    if (this.gradeScaleForm.minPercentage > this.gradeScaleForm.maxPercentage) {
      this.triggerError('Validation Error', 'Min percentage cannot be greater than max percentage'); return;
    }
    this.isProcessing = true;
    this.closeDialog();

    if (this.isEditMode && this.gradeScaleForm.gradeId) {
      this.examService.updateGradeScale(this.gradeScaleForm.gradeId, this.gradeScaleForm)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: (res) => {
            const index = this.gradeScales.findIndex(g => g.gradeId === this.gradeScaleForm.gradeId);
            if (index !== -1) this.gradeScales[index] = { ...res };
            this.filteredGradeScales = [...this.gradeScales]; this.updatePagination();
            this.triggerSuccess('Updated!', 'Grade scale updated successfully.');
          },
          error: (err) => { console.error(err); this.triggerError('Error', err.error?.message || 'Failed to update grade scale.'); }
        });
    } else {
      this.examService.addGradeScale(this.gradeScaleForm)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: (res) => {
            this.gradeScales.push(res); this.filteredGradeScales = [...this.gradeScales]; this.updatePagination();
            this.triggerSuccess('Added!', 'Grade scale added successfully.');
          },
          error: (err) => { console.error(err); this.triggerError('Error', err.error?.message || 'Failed to add grade scale.'); }
        });
    }
  }

  deleteGradeScale(g: GradeScale) { this.gradeScaleToDelete = g; this.showDeleteDialog = true; }

  confirmDeleteGradeScale() {
    if (this.gradeScaleToDelete?.gradeId) {
      this.showDeleteDialog = false;
      this.isProcessing = true;
      this.examService.deleteGradeScale(this.gradeScaleToDelete.gradeId)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: () => {
            this.gradeScales = this.gradeScales.filter(g => g.gradeId !== this.gradeScaleToDelete!.gradeId);
            this.filteredGradeScales = [...this.gradeScales]; this.updatePagination(); this.gradeScaleToDelete = null;
            this.triggerSuccess('Deleted!', 'Grade scale has been deleted.');
          },
          error: (err) => { console.error(err); this.triggerError('Error', err.error?.message || 'Failed to delete grade scale.'); }
        });
    }
  }

  refreshData() { this.loadGradeScales(); }

  resetForm() {
    this.gradeScaleForm = { grade: '', minPercentage: 0, maxPercentage: 0, gradePoint: 0, remarks: '' };
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
}
