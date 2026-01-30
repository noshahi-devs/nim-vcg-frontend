import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ExamScheduleService } from '../../../services/exam-schedule.service';
import { ExamScheduleVm } from '../../../Models/exam-schedule-vm';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';

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

  rowsPerPage: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  searchTerm: string = "";

  form!: FormGroup;

  showAddEditDialog = false;
  showViewDialog = false;
  showDeleteDialog = false;

  isEditMode = false;

  selectedSchedule!: ExamScheduleVm;
  scheduleToDelete!: ExamScheduleVm;

  constructor(private service: ExamScheduleService) { }

  ngOnInit(): void {
    this.initForm();
    this.loadExamSchedules();
  }

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
    this.service.GetExamSchedules().subscribe({
      next: (res: ExamScheduleVm[]) => {
        this.examSchedules = res || [];
        this.filteredExamSchedules = [...this.examSchedules];
        this.updatePagination();
      },
      error: () => {
        this.examSchedules = [];
        this.filteredExamSchedules = [];
        this.paginatedExamSchedules = [];
      }
    });
  }

  searchExamSchedules() {
    this.filteredExamSchedules = this.examSchedules.filter(x =>
      x.examScheduleName?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExamSchedules.length / this.rowsPerPage);
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    this.paginatedExamSchedules = this.filteredExamSchedules.slice(start, end);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  get toEntry() {
    return this.filteredExamSchedules.length === 0
      ? 0
      : Math.min(this.currentPage * this.rowsPerPage, this.filteredExamSchedules.length);
  }

  // Open Add form
  openAddDialog() {
    this.isEditMode = false;
    this.showAddEditDialog = true;
    this.form.reset({
      examScheduleId: 0,
    });
  }

  // Open Edit form
  openEditDialog(schedule: ExamScheduleVm) {
    this.isEditMode = true;
    this.showAddEditDialog = true;
    this.form.patchValue(schedule);
  }

  // View Details
  openViewDialog(schedule: ExamScheduleVm) {
    this.selectedSchedule = schedule;
    this.showViewDialog = true;
  }

  // Save
  saveExamSchedule() {
    if (this.form.invalid) return;

    const payload = this.form.value;

    if (this.isEditMode) {
      this.service.UpdateExamSchedule(payload).subscribe(() => {
        this.closeDialog();
        this.loadExamSchedules();
      });
    } else {
      this.service.SaveExamSchedule(payload).subscribe(() => {
        this.closeDialog();
        this.loadExamSchedules();
      });
    }
  }

  // Confirm delete
  confirmDelete(schedule: ExamScheduleVm) {
    this.scheduleToDelete = schedule;
    this.showDeleteDialog = true;
  }

  // Delete final
  deleteExamSchedule() {
    if (!this.scheduleToDelete) return;

    this.service.DeleteExamSchedule(this.scheduleToDelete.examScheduleId).subscribe(() => {
      this.showDeleteDialog = false;
      this.loadExamSchedules();
    });
  }

  // Close modals
  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.form.reset();
  }

}
