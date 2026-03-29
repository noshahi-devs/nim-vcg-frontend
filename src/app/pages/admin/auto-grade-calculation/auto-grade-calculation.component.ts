import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamService, GradeScale, Exam } from '../../../services/exam.service';
import { finalize } from 'rxjs/operators';
import { PopupService } from '../../../services/popup.service';

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

  isProcessing = false;

  constructor(
    private examService: ExamService,
    private popup: PopupService
  ) { }

  ngOnInit() { this.loadGradeScales(); this.loadExams(); }

  // Modals handled by PopupService

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
      this.popup.error('Error', 'Please select an exam first.'); return;
    }
    const selectedExam = this.exams.find(e => e.examId === this.selectedGenerateExamId);
    this.popup.loading('Calculating grades & generating results...');
    this.examService.generateResults(this.selectedGenerateExamId)
      .pipe(finalize(() => { this.isGeneratingResult = false; this.isProcessing = false; }))
      .subscribe({
        next: () => { this.popup.success('Success!', 'Results have been generated and grades calculated successfully.'); },
        error: (err) => {
          console.error('Generation Error:', err);
          const errorMsg = err.error?.message || err.error || 'Check marks entry or grade scale settings.';
          this.popup.error('Calculation Failed', `Error: ${errorMsg}`);
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
      this.popup.error('Validation Error', 'Please fill all required fields'); return;
    }
    if (this.gradeScaleForm.minPercentage > this.gradeScaleForm.maxPercentage) {
      this.popup.error('Validation Error', 'Min percentage cannot be greater than max percentage'); return;
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
            this.popup.success('Updated!', 'Grade scale updated successfully.');
          },
          error: (err) => { console.error(err); this.popup.error('Error', err.error?.message || 'Failed to update grade scale.'); }
        });
    } else {
      this.examService.addGradeScale(this.gradeScaleForm)
        .pipe(finalize(() => this.isProcessing = false))
        .subscribe({
          next: (res) => {
            this.gradeScales.push(res); this.filteredGradeScales = [...this.gradeScales]; this.updatePagination();
            this.popup.success('Added!', 'Grade scale added successfully.');
          },
          error: (err) => { console.error(err); this.popup.error('Error', err.error?.message || 'Failed to add grade scale.'); }
        });
    }
  }

  deleteGradeScale(g: GradeScale) {
    if (!g.gradeId) return;
    this.popup.confirm('Delete Grade?', `Are you sure you want to delete grade "${g.grade}"?`).then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting grade...');
        this.examService.deleteGradeScale(g.gradeId!)
          .subscribe({
            next: () => {
              this.gradeScales = this.gradeScales.filter(x => x.gradeId !== g.gradeId);
              this.filteredGradeScales = [...this.gradeScales];
              this.updatePagination();
              this.popup.deleted('Grade scale');
            },
            error: (err) => {
              console.error(err);
              this.popup.error('Error', err.error?.message || 'Failed to delete grade scale.');
            }
          });
      }
    });
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
