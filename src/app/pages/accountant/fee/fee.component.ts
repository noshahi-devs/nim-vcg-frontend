import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FeeTypeService } from '../../../services/feetype.service';
import { FeeType } from '../../../Models/feetype';
import Swal from '../../../swal';

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

  // Dialog visibility (only Add/Edit + View still use custom modal)
  showAddEditDialog = false;
  showViewDialog = false;
  isEditMode = false;
  selectedFeeType!: FeeType;

  // Premium Modal State
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;

  // For Deletion Confirmation
  showDeleteModal = false;
  feeTypeToDelete: FeeType | null = null;

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
        this.showFeedback('error', 'Error', 'Failed to load fee types.');
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
    this.totalPages = Math.max(1, Math.ceil(this.filteredFeeTypes.length / this.rowsPerPage));
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

    this.isProcessing = true;

    if (this.isEditMode) {
      this.feeTypeService.updateFeeType(payload).subscribe({
        next: () => {
          this.isProcessing = false;
          this.closeDialog();
          this.loadFeeTypes();
          this.showFeedback('success', 'Updated!', 'Fee type updated successfully.');
        },
        error: () => {
          this.isProcessing = false;
          this.showFeedback('error', 'Error', 'Failed to update fee type.');
        }
      });
    } else {
      this.feeTypeService.createFeeType(payload).subscribe({
        next: () => {
          this.isProcessing = false;
          this.closeDialog();
          this.loadFeeTypes();
          this.showFeedback('success', 'Added!', 'Fee type added successfully.');
        },
        error: () => {
          this.isProcessing = false;
          this.showFeedback('error', 'Error', 'Failed to add fee type.');
        }
      });
    }
  }

  confirmDelete(ft: FeeType): void {
    this.feeTypeToDelete = ft;
    this.showDeleteModal = true;
  }

  deleteFeeType(): void {
    if (!this.feeTypeToDelete) return;
    const id = this.feeTypeToDelete.feeTypeId;
    const name = this.feeTypeToDelete.typeName;

    this.isProcessing = true;
    this.feeTypeService.deleteFeeType(id).subscribe({
      next: () => {
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.feeTypeToDelete = null;
        this.loadFeeTypes();
        this.showFeedback('success', 'Deleted!', `"${name}" has been deleted.`);
      },
      error: () => {
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.feeTypeToDelete = null;
        this.showFeedback('error', 'Error', 'Failed to delete fee type.');
      }
    });
  }

  showFeedback(type: 'success' | 'error' | 'warning', title: string, message: string) {
    this.feedbackType = type;
    this.feedbackTitle = title;
    this.feedbackMessage = message;
    this.showFeedbackModal = true;
  }

  closeFeedback() {
    this.showFeedbackModal = false;
  }

  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.form.reset();
  }
}


