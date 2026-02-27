import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExamScheduleService } from '../../../services/exam-schedule.service';
import { ExamScheduleVm } from '../../../Models/exam-schedule-vm';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { AuthService } from '../../../SecurityModels/auth.service';
import Swal from 'sweetalert2';
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

  rowsPerPage: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  searchTerm: string = "";
  loading = false;

  form!: FormGroup;

  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;

  selectedSchedule: ExamScheduleVm | null = null;
  Math = Math;

  constructor(
    private service: ExamScheduleService,
    public authService: AuthService
  ) { }

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
    this.loading = true;
    this.service.GetExamSchedules()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res: ExamScheduleVm[]) => {
          this.examSchedules = res || [];
          this.filteredExamSchedules = [...this.examSchedules];
          this.updatePagination();
        },
        error: (err) => {
          console.error(err);
          this.examSchedules = [];
          this.filteredExamSchedules = [];
          this.updatePagination();
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
    this.totalPages = Math.ceil(this.filteredExamSchedules.length / this.rowsPerPage) || 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    this.paginatedExamSchedules = this.filteredExamSchedules.slice(start, end);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  openAddDialog() {
    this.isEditMode = false;
    this.form.reset({
      examScheduleId: 0,
      examYear: new Date().getFullYear().toString()
    });
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

  openViewDialog(schedule: ExamScheduleVm) {
    this.selectedSchedule = schedule;
    this.showViewDialog = true;
  }

  async saveExamSchedule() {
    if (this.form.invalid) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    const payload = this.form.value;
    const request = this.isEditMode
      ? this.service.UpdateExamSchedule(payload)
      : this.service.SaveExamSchedule(payload);

    Swal.fire({
      title: this.isEditMode ? 'Updating...' : 'Saving...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    request.subscribe({
      next: () => {
        Swal.fire('Success', `Schedule ${this.isEditMode ? 'updated' : 'saved'} successfully`, 'success');
        this.closeDialog();
        this.loadExamSchedules();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to save schedule', 'error');
      }
    });
  }

  confirmDelete(schedule: ExamScheduleVm) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete "${schedule.examScheduleName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.DeleteExamSchedule(schedule.examScheduleId).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Schedule has been deleted.', 'success');
            this.loadExamSchedules();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'Failed to delete schedule.', 'error');
          }
        });
      }
    });
  }

  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.selectedSchedule = null;
    this.form.reset();
  }
}
