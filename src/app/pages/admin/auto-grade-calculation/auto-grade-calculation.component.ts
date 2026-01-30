import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { ExamService, GradeScale } from '../../../services/exam.service';
import { finalize } from 'rxjs/operators';
import Swal from 'sweetalert2';

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
  isEditMode = false;
  selectedGradeScale: GradeScale | null = null;

  gradeScaleForm: GradeScale = {
    grade: '',
    minPercentage: 0,
    maxPercentage: 0,
    gradePoint: 0,
    remarks: ''
  };

  Math = Math;

  constructor(private examService: ExamService) { }

  ngOnInit() {
    this.loadGradeScales();
  }

  loadGradeScales() {
    this.loading = true;
    this.examService
      .getAllGradeScales()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.gradeScales = res || [];
          if (this.gradeScales.length === 0) {
            this.loadMockData();
          }
          this.filteredGradeScales = [...this.gradeScales];
          this.updatePagination();
        },
        error: (err) => {
          console.error('Error fetching grade scales:', err);
          this.loadMockData();
        }
      });
  }

  loadMockData() {
    this.gradeScales = [
      {
        gradeId: 1,
        grade: 'A+',
        minPercentage: 90,
        maxPercentage: 100,
        gradePoint: 4.0,
        remarks: 'Outstanding'
      },
      {
        gradeId: 2,
        grade: 'A',
        minPercentage: 80,
        maxPercentage: 89,
        gradePoint: 3.7,
        remarks: 'Excellent'
      },
      {
        gradeId: 3,
        grade: 'B',
        minPercentage: 70,
        maxPercentage: 79,
        gradePoint: 3.3,
        remarks: 'Very Good'
      },
      {
        gradeId: 4,
        grade: 'C',
        minPercentage: 60,
        maxPercentage: 69,
        gradePoint: 3.0,
        remarks: 'Good'
      },
      {
        gradeId: 5,
        grade: 'D',
        minPercentage: 50,
        maxPercentage: 59,
        gradePoint: 2.0,
        remarks: 'Satisfactory'
      },
      {
        gradeId: 6,
        grade: 'F',
        minPercentage: 0,
        maxPercentage: 49,
        gradePoint: 0.0,
        remarks: 'Fail'
      }
    ];
    this.filteredGradeScales = [...this.gradeScales];
    this.updatePagination();
  }

  searchGradeScales() {
    const term = this.searchTerm.toLowerCase();
    this.filteredGradeScales = this.gradeScales.filter(g =>
      g.grade.toLowerCase().includes(term) ||
      g.remarks?.toLowerCase().includes(term)
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredGradeScales.length / this.rowsPerPage) || 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    this.paginatedGradeScales = this.filteredGradeScales.slice(start, end);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  openAddDialog() {
    this.resetForm();
    this.isEditMode = false;
    this.showAddEditDialog = true;
  }

  openEditDialog(gradeScale: GradeScale) {
    this.gradeScaleForm = { ...gradeScale };
    this.isEditMode = true;
    this.showAddEditDialog = true;
  }

  openViewDialog(gradeScale: GradeScale) {
    this.selectedGradeScale = gradeScale;
    this.showViewDialog = true;
  }

  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.selectedGradeScale = null;
  }

  saveGradeScale() {
    // Validation
    if (!this.gradeScaleForm.grade ||
      this.gradeScaleForm.minPercentage === undefined ||
      this.gradeScaleForm.maxPercentage === undefined) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill all required fields'
      });
      return;
    }

    if (this.gradeScaleForm.minPercentage > this.gradeScaleForm.maxPercentage) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Min percentage cannot be greater than max percentage'
      });
      return;
    }

    if (this.isEditMode && this.gradeScaleForm.gradeId) {
      this.examService.updateGradeScale(this.gradeScaleForm.gradeId, this.gradeScaleForm).subscribe({
        next: (res) => {
          const index = this.gradeScales.findIndex(g => g.gradeId === this.gradeScaleForm.gradeId);
          if (index !== -1) {
            this.gradeScales[index] = { ...res };
          }
          this.filteredGradeScales = [...this.gradeScales];
          this.updatePagination();
          this.closeDialog();
          Swal.fire({
            icon: 'success',
            title: 'Grade Scale Updated Successfully!',
            showConfirmButton: false,
            timer: 1500
          });
        },
        error: (err) => {
          console.error('Update failed:', err);
          Swal.fire({
            icon: 'error',
            title: 'Failed to Update Grade Scale',
            text: err.error?.message || 'Something went wrong!'
          });
        }
      });
    } else {
      this.examService.addGradeScale(this.gradeScaleForm).subscribe({
        next: (res) => {
          this.gradeScales.push(res);
          this.filteredGradeScales = [...this.gradeScales];
          this.updatePagination();
          this.closeDialog();
          Swal.fire({
            icon: 'success',
            title: 'Grade Scale Added Successfully!',
            showConfirmButton: false,
            timer: 1500
          });
        },
        error: (err) => {
          console.error('Add failed:', err);
          Swal.fire({
            icon: 'error',
            title: 'Failed to Add Grade Scale',
            text: err.error?.message || 'Something went wrong!'
          });
        }
      });
    }
  }

  deleteGradeScale(gradeScale: GradeScale) {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete grade "${gradeScale.grade}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed && gradeScale.gradeId) {
        this.examService.deleteGradeScale(gradeScale.gradeId).subscribe({
          next: () => {
            this.gradeScales = this.gradeScales.filter(g => g.gradeId !== gradeScale.gradeId);
            this.filteredGradeScales = [...this.gradeScales];
            this.updatePagination();
            Swal.fire({
              icon: 'success',
              title: 'Deleted!',
              text: 'Grade scale has been deleted.',
              showConfirmButton: false,
              timer: 1500
            });
          },
          error: (err) => {
            console.error('Delete failed:', err);
            Swal.fire({
              icon: 'error',
              title: 'Failed to Delete',
              text: err.error?.message || 'Something went wrong!'
            });
          }
        });
      }
    });
  }

  refreshData() {
    this.loadGradeScales();
  }

  resetForm() {
    this.gradeScaleForm = {
      grade: '',
      minPercentage: 0,
      maxPercentage: 0,
      gradePoint: 0,
      remarks: ''
    };
  }

  getGradeBadgeClass(grade: string): string {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-success-focus text-success-600 border border-success-main';
      case 'B':
        return 'bg-info-focus text-info-600 border border-info-main';
      case 'C':
        return 'bg-warning-focus text-warning-600 border border-warning-main';
      case 'D':
        return 'bg-orange-focus text-orange-600 border border-orange-main';
      case 'F':
        return 'bg-danger-focus text-danger-600 border border-danger-main';
      default:
        return 'bg-neutral-200 text-neutral-600';
    }
  }
}