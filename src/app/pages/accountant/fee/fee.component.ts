import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FeeTypeService } from '../../../services/feetype.service';
import { FeeType } from '../../../Models/feetype';

@Component({
  selector: 'app-fee',
  standalone: true,
  templateUrl: './fee.component.html',
  styleUrls: ['./fee.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent]
})
export class FeeComponent implements OnInit {

  title = 'Fee Types';

  form!: FormGroup;

  feeTypes: FeeType[] = [];
  filteredFeeTypes: FeeType[] = [];
  paginatedFeeTypes: FeeType[] = [];

  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  searchTerm = '';

  showAddEditDialog = false;
  showViewDialog = false;
  showDeleteDialog = false;
  isEditMode = false;

  selectedFeeType!: FeeType;
  feeTypeToDelete!: FeeType;

  /** Toast notification state */
  toast: { show: boolean; type: 'success' | 'error' | 'info'; message: string } = {
    show: false,
    type: 'success',
    message: ''
  };
  private toastTimer: any;

  constructor(private feeTypeService: FeeTypeService) { }

  ngOnInit(): void {
    this.initForm();
    this.loadFeeTypes();
  }

  initForm() {
    this.form = new FormGroup({
      feeTypeId: new FormControl(0),
      typeName: new FormControl('', Validators.required)
    });
  }

  loadFeeTypes() {
    this.feeTypeService.getFeeTypes().subscribe({
      next: (res) => {
        this.feeTypes = res || [];
        this.filteredFeeTypes = [...this.feeTypes];
        this.updatePagination();
      },
      error: () => {
        this.feeTypes = [];
        this.filteredFeeTypes = [];
        this.paginatedFeeTypes = [];
        this.showToast('error', 'Failed to load fee types. Please try again.');
      }
    });
  }

  searchFeeTypes() {
    this.filteredFeeTypes = this.feeTypes.filter(x =>
      x.typeName?.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredFeeTypes.length / this.rowsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedFeeTypes = this.filteredFeeTypes.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  get toEntry() {
    return this.filteredFeeTypes.length === 0
      ? 0
      : Math.min(this.currentPage * this.rowsPerPage, this.filteredFeeTypes.length);
  }

  openAddDialog() {
    this.isEditMode = false;
    this.showAddEditDialog = true;
    this.form.reset({ feeTypeId: 0 });
  }

  openEditDialog(ft: FeeType) {
    this.isEditMode = true;
    this.showAddEditDialog = true;
    this.form.patchValue(ft);
  }

  openViewDialog(ft: FeeType) {
    this.selectedFeeType = ft;
    this.showViewDialog = true;
  }

  saveFeeType() {
    if (this.form.invalid) return;

    const payload = this.form.value;

    if (this.isEditMode) {
      this.feeTypeService.updateFeeType(payload).subscribe({
        next: () => {
          this.closeDialog();
          this.loadFeeTypes();
          this.showToast('success', `Fee type updated successfully!`);
        },
        error: () => {
          this.showToast('error', 'Failed to update fee type. Please try again.');
        }
      });
    } else {
      this.feeTypeService.createFeeType(payload).subscribe({
        next: () => {
          this.closeDialog();
          this.loadFeeTypes();
          this.showToast('success', `Fee type added successfully!`);
        },
        error: () => {
          this.showToast('error', 'Failed to add fee type. Please try again.');
        }
      });
    }
  }

  confirmDelete(ft: FeeType) {
    this.feeTypeToDelete = ft;
    this.showDeleteDialog = true;
  }

  deleteFeeType() {
    this.feeTypeService.deleteFeeType(this.feeTypeToDelete.feeTypeId).subscribe({
      next: () => {
        this.showDeleteDialog = false;
        this.loadFeeTypes();
        this.showToast('success', `"${this.feeTypeToDelete.typeName}" deleted successfully.`);
      },
      error: () => {
        this.showDeleteDialog = false;
        this.showToast('error', 'Failed to delete fee type. Please try again.');
      }
    });
  }

  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.showDeleteDialog = false;
    this.form.reset();
  }

  /** Shows a toast and auto-hides after 3.5 seconds */
  showToast(type: 'success' | 'error' | 'info', message: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { show: true, type, message };
    this.toastTimer = setTimeout(() => {
      this.toast.show = false;
    }, 3500);
  }
}
