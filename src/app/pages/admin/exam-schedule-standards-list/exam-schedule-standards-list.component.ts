import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamScheduleStandardService } from '../../../services/exam-schedule-standard.service';

declare var bootstrap: any;

@Component({
  selector: 'app-exam-schedule-standards-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BreadcrumbComponent],
  templateUrl: './exam-schedule-standards-list.component.html',
  styleUrls: ['./exam-schedule-standards-list.component.css'],

})
export class ExamScheduleStandardsListComponent implements OnInit {

  title = 'Exam Schedule Standards';

  list: any[] = [];
  filteredList: any[] = [];
  paginatedList: any[] = [];

  searchTerm = '';
  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 0;

  selectedItem: any = null;
  editModel: any = null;
  deleteId: number | null = null;

  constructor(private service: ExamScheduleStandardService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.service.GetExamScheduleStandards().subscribe(res => {
      this.list = res;
      this.filteredList = [...this.list];
      this.updatePagination();
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
    this.totalPages = Math.ceil(this.filteredList.length / this.rowsPerPage);
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
    new bootstrap.Modal(document.getElementById('viewModal')).show();
  }

  /* ---------- EDIT ---------- */
  openEditModal(item: any) {
    this.editModel = JSON.parse(JSON.stringify(item));
    new bootstrap.Modal(document.getElementById('editModal')).show();
  }

  update() {
    this.service.updateExamScheduleStandards(this.editModel).subscribe(() => {
      bootstrap.Modal.getInstance(document.getElementById('editModal'))?.hide();
      this.loadData();
    });
  }

  /* ---------- DELETE ---------- */
  confirmDelete(id: number) {
    this.deleteId = id;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
  }

  delete() {
    if (!this.deleteId) return;
    this.service.DeleteExamScheduleStandard(this.deleteId).subscribe(() => {
      bootstrap.Modal.getInstance(document.getElementById('deleteModal'))?.hide();
      this.loadData();
    });
  }
}
