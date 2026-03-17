import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamScheduleService } from '../../../services/exam-schedule.service';
import { ExamScheduleVm } from '../../../Models/exam-schedule-vm';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AuthService } from '../../../SecurityModels/auth.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-exam-schedule',
  standalone: true,
  templateUrl: './exam-schedule.component.html',
  styleUrls: ['./exam-schedule.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent]
})
export class ExamScheduleComponent implements OnInit {
  title = "Exam Schedule";

  examSchedules: ExamScheduleVm[] = [];
  filteredExamSchedules: ExamScheduleVm[] = [];
  paginatedExamSchedules: ExamScheduleVm[] = [];

  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  searchTerm = "";
  loading = false;

  form!: FormGroup;
  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;
  selectedSchedule: ExamScheduleVm | null = null;
  public Math: any = Math;

  // ── Premium Modal State ──
  isProcessing = false;
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  scheduleToDelete: ExamScheduleVm | null = null;

  constructor(private service: ExamScheduleService, public authService: AuthService) { }

  ngOnInit(): void { this.initForm(); this.loadExamSchedules(); }

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
      examScheduleId: new FormControl(0),
      examScheduleName: new FormControl('', Validators.required),
      startDate: new FormControl('', Validators.required),
      endDate: new FormControl('', Validators.required),
      examYear: new FormControl('', Validators.required)
    });
  }

  loadExamSchedules() {
    this.loading = true;
    this.service.GetExamSchedules()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => { this.examSchedules = res || []; this.filteredExamSchedules = [...this.examSchedules]; this.updatePagination(); },
        error: (err) => { console.error(err); this.examSchedules = []; this.filteredExamSchedules = []; this.updatePagination(); }
      });
  }

  searchExamSchedules() {
    this.filteredExamSchedules = this.examSchedules.filter(x => x.examScheduleName?.toLowerCase().includes(this.searchTerm.toLowerCase()));
    this.currentPage = 1; this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExamSchedules.length / this.rowsPerPage) || 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedExamSchedules = this.filteredExamSchedules.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page; this.updatePagination();
  }

  openAddDialog() {
    this.isEditMode = false;
    this.form.reset({ examScheduleId: 0, examYear: new Date().getFullYear().toString() });
    this.showAddEditDialog = true;
  }

  openEditDialog(schedule: ExamScheduleVm) {
    this.isEditMode = true;
    this.form.patchValue({
      ...schedule,
      startDate: schedule.startDate ? new Date(schedule.startDate).toISOString().split('T')[0] : '',
      endDate: schedule.endDate ? new Date(schedule.endDate).toISOString().split('T')[0] : ''
    });
    this.showAddEditDialog = true;
  }

  openViewDialog(schedule: ExamScheduleVm) { this.selectedSchedule = schedule; this.showViewDialog = true; }

  saveExamSchedule() {
    if (this.form.invalid) { this.triggerError('Error', 'Please fill all required fields'); return; }
    const payload = this.form.value;
    const request = this.isEditMode ? this.service.UpdateExamSchedule(payload) : this.service.SaveExamSchedule(payload);
    this.isProcessing = true;
    this.closeDialog();

    request.pipe(finalize(() => this.isProcessing = false)).subscribe({
      next: () => {
        this.triggerSuccess('Success', `Schedule ${this.isEditMode ? 'updated' : 'saved'} successfully`);
        this.loadExamSchedules();
      },
      error: (err) => { console.error(err); this.triggerError('Error', 'Failed to save schedule'); }
    });
  }

  confirmDelete(schedule: ExamScheduleVm) {
    this.scheduleToDelete = schedule;
    this.confirmTitle = 'Delete Schedule';
    this.confirmMessage = `Are you sure you want to delete "${schedule.examScheduleName}"?`;
    this.showConfirmModal = true;
  }

  cancelConfirm() { this.showConfirmModal = false; this.scheduleToDelete = null; }

  executeDelete() {
    if (!this.scheduleToDelete) return;
    this.showConfirmModal = false;
    this.isProcessing = true;
    this.service.DeleteExamSchedule(this.scheduleToDelete.examScheduleId)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: () => { this.triggerSuccess('Deleted!', 'Schedule has been deleted.'); this.loadExamSchedules(); },
        error: (err) => { console.error(err); this.triggerError('Error', 'Failed to delete schedule.'); }
      });
  }

  getDaysDifference(startDate: any, endDate: any): number {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate); const end = new Date(endDate);
    return Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  closeDialog() { this.showAddEditDialog = false; this.showViewDialog = false; this.selectedSchedule = null; this.form.reset(); }
}
