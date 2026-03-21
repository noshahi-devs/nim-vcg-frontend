import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ExamtypeService } from '../../../services/examtype.service';
import { Examtype } from '../../../Models/examtype';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-exam',
  standalone: true,
  templateUrl: './exam.component.html',
  styleUrls: ['./exam.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent]
})
export class ExamComponent implements OnInit {
  title = "Exam Types";
  Math = Math;

  form!: FormGroup;
  examTypes: Examtype[] = [];
  filteredExamTypes: Examtype[] = [];
  paginatedExamTypes: Examtype[] = [];

  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  searchTerm = "";
  loading = false;

  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;
  selectedExamType!: Examtype;

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  examTypeToDelete!: Examtype;
  showDeleteDialog = false; // legacy HTML reference

  constructor(private examTypeService: ExamtypeService, private authService: AuthService) { }

  ngOnInit(): void { this.initForm(); this.loadExamTypes(); }

  hasRole(role: string): boolean { return this.authService.hasRole(role); }

  // ── Helpers ──
  triggerSuccess(title: string, msg: string) {
    this.feedbackType = 'success'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  triggerError(title: string, msg: string) {
    this.feedbackType = 'error'; this.feedbackTitle = title; this.feedbackMessage = msg; this.showFeedbackModal = true;
  }
  closeFeedback() { this.showFeedbackModal = false; }

  initForm() {
    this.form = new FormGroup({
      examTypeId: new FormControl(0),
      examTypeName: new FormControl('', Validators.required)
    });
  }

  loadExamTypes() {
    this.loading = true;
    this.examTypeService.GetdbsExamType().pipe(finalize(() => this.loading = false)).subscribe({
      next: (res) => { this.examTypes = res || []; this.filteredExamTypes = [...this.examTypes]; this.updatePagination(); },
      error: () => { this.examTypes = []; this.filteredExamTypes = []; this.paginatedExamTypes = []; }
    });
  }

  searchExamTypes() {
    this.filteredExamTypes = this.examTypes.filter(x => x.examTypeName?.toLowerCase().includes(this.searchTerm.toLowerCase()));
    this.currentPage = 1; this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExamTypes.length / this.rowsPerPage);
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedExamTypes = this.filteredExamTypes.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page; this.updatePagination();
  }

  get toEntry() {
    return this.filteredExamTypes.length === 0 ? 0 : Math.min(this.currentPage * this.rowsPerPage, this.filteredExamTypes.length);
  }

  openAddDialog() { this.isEditMode = false; this.showAddEditDialog = true; this.form.reset({ examTypeId: 0 }); }
  openEditDialog(et: Examtype) { this.isEditMode = true; this.showAddEditDialog = true; this.form.patchValue(et); }
  openViewDialog(et: Examtype) { this.selectedExamType = et; this.showViewDialog = true; }

  saveExamType() {
    if (this.form.invalid) return;
    const payload = this.form.value;
    this.isProcessing = true;
    this.closeDialog();

    const request = this.isEditMode
      ? this.examTypeService.UpdateExamType(payload)
      : this.examTypeService.SaveExamType(payload);

    request.pipe(finalize(() => this.isProcessing = false)).subscribe({
      next: () => {
        this.triggerSuccess(this.isEditMode ? 'Updated!' : 'Saved!', `Exam type ${this.isEditMode ? 'updated' : 'saved'} successfully.`);
        this.loadExamTypes();
      },
      error: () => this.triggerError('Error', `Failed to ${this.isEditMode ? 'update' : 'save'} exam type.`)
    });
  }

  confirmDelete(et: Examtype) {
    this.examTypeToDelete = et;
    this.confirmTitle = 'Delete Exam Type';
    this.confirmMessage = `Are you sure you want to delete "${et.examTypeName}"? This cannot be undone.`;
    this.showConfirmModal = true;
  }

  cancelConfirm() { this.showConfirmModal = false; }

  deleteExamType() {
    if (!this.examTypeToDelete) return;
    this.showConfirmModal = false;
    this.isProcessing = true;
    this.examTypeService.DeleteExamType(this.examTypeToDelete.examTypeId)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: () => { this.triggerSuccess('Deleted!', 'Exam type deleted successfully.'); this.loadExamTypes(); },
        error: () => this.triggerError('Error', 'Failed to delete exam type.')
      });
  }

  closeDialog() { this.showAddEditDialog = false; this.showViewDialog = false; this.form.reset(); }
}
