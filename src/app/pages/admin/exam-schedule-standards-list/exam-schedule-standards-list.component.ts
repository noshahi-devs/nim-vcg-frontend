import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamScheduleStandardService } from '../../../services/exam-schedule-standard.service';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

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

  showViewDialog = false;
  showEditDialog = false;
  showDeleteDialog = false;
  itemToDeleteId: number | null = null;
  itemToDeleteName = '';

  isProcessing = false;

  constructor(
    private service: ExamScheduleStandardService,
    private popup: PopupService
  ) { }

  ngOnInit(): void { this.loadData(); }

  // Modals handled by PopupService

  loadData() {
    this.loading = true;
    this.service.GetExamScheduleStandards()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (res) => { this.list = res || []; this.filteredList = [...this.list]; this.updatePagination(); },
        error: (err) => { console.error(err); this.list = []; this.filteredList = []; this.updatePagination(); }
      });
  }

  search() {
    const term = this.searchTerm.toLowerCase();
    this.filteredList = this.list.filter(x => x.examScheduleName?.toLowerCase().includes(term) || x.standardName?.toLowerCase().includes(term));
    this.currentPage = 1; this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredList.length / this.rowsPerPage) || 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedList = this.filteredList.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page; this.updatePagination();
  }

  openViewModal(item: any) { this.selectedItem = item; this.showViewDialog = true; }
  openEditModal(item: any) {
    this.editModel = JSON.parse(JSON.stringify(item));
    // Format dates and times for HTML5 inputs
    if (this.editModel.examSubjects) {
      this.editModel.examSubjects.forEach((s: any) => {
        if (s.examDate) {
          s.examDate = new Date(s.examDate).toISOString().substring(0, 10);
        }
        if (s.examStartTime) {
          const startTime = new Date(s.examStartTime);
          if (!isNaN(startTime.getTime())) {
            s.examStartTime = startTime.getHours().toString().padStart(2, '0') + ':' +
              startTime.getMinutes().toString().padStart(2, '0');
          }
        }
        if (s.examEndTime) {
          const endTime = new Date(s.examEndTime);
          if (!isNaN(endTime.getTime())) {
            s.examEndTime = endTime.getHours().toString().padStart(2, '0') + ':' +
              endTime.getMinutes().toString().padStart(2, '0');
          }
        }
      });
    }
    this.showEditDialog = true;
  }

  closeDialog() {
    this.showViewDialog = false; this.showEditDialog = false; this.showDeleteDialog = false;
    this.selectedItem = null; this.itemToDeleteId = null;
  }

  update() {
    this.isProcessing = true;
    this.closeDialog();
    this.service.updateExamScheduleStandards(this.editModel)
      .pipe(finalize(() => this.isProcessing = false))
      .subscribe({
        next: () => { this.popup.success('Updated!', 'Schedule standard updated successfully.'); this.loadData(); },
        error: (err) => { console.error(err); this.popup.error('Error', 'Failed to update schedule standard'); }
      });
  }

  confirmDelete(id: number, name: string) {
    this.popup.confirm('Delete Entry?', `Are you sure you want to delete the entry for "${name}"?`).then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting entry...');
        this.service.DeleteExamScheduleStandard(id)
          .subscribe({
            next: () => {
              this.popup.deleted('Entry');
              this.loadData();
            },
            error: (err) => {
              console.error(err);
              this.popup.error('Error', 'Failed to delete entry.');
            }
          });
      }
    });
  }
}
