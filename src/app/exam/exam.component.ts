import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ExamtypeService } from '../services/examtype.service';
import { Examtype } from '../Models/examtype';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-exam',
  standalone: true,
  templateUrl: './exam.component.html',
  styleUrls: ['./exam.component.css'],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent]
})
export class ExamComponent implements OnInit {
// For Delete Modal
showDeleteDialog = false;
examTypeToDelete!: Examtype;

  title = "Exam Types";

  form!: FormGroup;

  examTypes: Examtype[] = [];
  filteredExamTypes: Examtype[] = [];
  paginatedExamTypes: Examtype[] = [];

  rowsPerPage: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;

  searchTerm: string = "";

  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;

  selectedExamType!: Examtype;

  constructor(private examTypeService: ExamtypeService) {}

  ngOnInit(): void {
    this.initForm();
    this.loadExamTypes();
  }

  initForm() {
    this.form = new FormGroup({
      examTypeId: new FormControl(0),
      examTypeName: new FormControl('', Validators.required)
    });
  }

  // Load exam types from service
  loadExamTypes() {
    this.examTypeService.GetdbsExamType().subscribe({
      next: (res) => {
        this.examTypes = res || [];
        this.filteredExamTypes = [...this.examTypes];
        this.updatePagination();
      },
      error: () => {
        this.examTypes = [];
        this.filteredExamTypes = [];
        this.paginatedExamTypes = [];
      }
    });
  }

  // Search exam types
  searchExamTypes() {
    this.filteredExamTypes = this.examTypes.filter(x =>
      x.examTypeName?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  // Pagination logic
  updatePagination() {
    this.totalPages = Math.ceil(this.filteredExamTypes.length / this.rowsPerPage);
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    this.paginatedExamTypes = this.filteredExamTypes.slice(start, end);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  get toEntry() {
    return this.filteredExamTypes.length === 0 ? 0 : Math.min(this.currentPage * this.rowsPerPage, this.filteredExamTypes.length);
  }

  // Open Add/Edit modal
  openAddDialog() {
    this.isEditMode = false;
    this.showAddEditDialog = true;
    this.form.reset({ examTypeId: 0 });
  }

  openEditDialog(et: Examtype) {
    this.isEditMode = true;
    this.showAddEditDialog = true;
    this.form.patchValue(et);
  }

  // Open View modal
  openViewDialog(et: Examtype) {
    this.selectedExamType = et;
    this.showViewDialog = true;
  }

  // Save Exam Type
  saveExamType() {
    if (this.form.invalid) return;

    const payload = this.form.value;
    if (this.isEditMode) {
      this.examTypeService.UpdateExamType(payload).subscribe(() => {
        this.closeDialog();
        this.loadExamTypes();
      });
    } else {
      this.examTypeService.SaveExamType(payload).subscribe(() => {
        this.closeDialog();
        this.loadExamTypes();
      });
    }
  }

 confirmDelete(et: Examtype) {
  this.examTypeToDelete = et;
  this.showDeleteDialog = true; // open custom modal
}

// Delete function triggered by modal button
deleteExamType() {
  if (!this.examTypeToDelete) return;

  this.examTypeService.DeleteExamType(this.examTypeToDelete.examTypeId).subscribe({
    next: () => {
      this.loadExamTypes();
      this.showDeleteDialog = false;
    }
  });
}


  // Close modals
  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.form.reset();
  }

}
