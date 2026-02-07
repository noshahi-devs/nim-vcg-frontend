import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamScheduleStandardService } from '../../../services/exam-schedule-standard.service';
import Swal from 'sweetalert2';
import { finalize } from 'rxjs';

declare var bootstrap: any;

@Component({
  selector: 'app-exam-schedule-standards-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BreadcrumbComponent],
  templateUrl: './exam-schedule-standards-list.component.html',
  styleUrls: ['./exam-schedule-standards-list.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ExamScheduleStandardsListComponent implements OnInit {

  title = 'Exam Schedule Standards';
  Math = Math;

  list: any[] = [];
  filteredList: any[] = [];
  paginatedList: any[] = [];

  searchTerm = '';
  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 0;
  loading = false;

  selectedItem: any = null;
  editModel: any = null;

  constructor(private service: ExamScheduleStandardService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.service.GetExamScheduleStandards()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => {
          this.list = res || [];
          this.filteredList = [...this.list];
          this.updatePagination();
        },
        error: (err) => {
          console.error(err);
          this.list = [];
          this.filteredList = [];
          this.updatePagination();
        }
      });
  }

  search() {
    const term = this.searchTerm.toLowerCase();
    this.filteredList = this.list.filter(x =>
      x.examScheduleName?.toLowerCase().includes(term) ||
      x.standardName?.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredList.length / this.rowsPerPage) || 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    this.paginatedList = this.filteredList.slice(start, end);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ---------- VIEW ---------- */
  openViewModal(item: any) {
    this.selectedItem = item;
    const modal = new bootstrap.Modal(document.getElementById('viewModal'));
    modal.show();
  }

  /* ---------- EDIT ---------- */
  openEditModal(item: any) {
    this.editModel = JSON.parse(JSON.stringify(item));
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
  }

  update() {
    Swal.fire({
      title: 'Updating...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.service.updateExamScheduleStandards(this.editModel).subscribe({
      next: () => {
        Swal.fire('Updated!', 'Schedule standard updated successfully', 'success');
        const modalElement = document.getElementById('editModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        modal?.hide();
        this.loadData();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'Failed to update schedule standard', 'error');
      }
    });
  }

  /* ---------- DELETE ---------- */
  confirmDelete(id: number, name: string) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the schedule standard for "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.service.DeleteExamScheduleStandard(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', 'Schedule standard has been deleted.', 'success');
            this.loadData();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'Failed to delete entry.', 'error');
          }
        });
      }
    });
  }
}
