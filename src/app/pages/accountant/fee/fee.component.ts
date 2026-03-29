import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FeeTypeService } from '../../../services/feetype.service';
import { FeeType } from '../../../Models/feetype';
import { finalize } from 'rxjs';
import { PopupService } from '../../../services/popup.service';

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
  loading = false;

  showDeleteModal = false;
  feeTypeToDelete: FeeType | null = null;
  isProcessing = false;

  constructor(
    private feeTypeService: FeeTypeService,
    private popup: PopupService
  ) { }

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
    this.loading = true;
    this.feeTypeService.getFeeTypes().pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res) => {
        this.feeTypes = res || [];
        this.filteredFeeTypes = [...this.feeTypes];
        this.updatePagination();
      },
      error: () => {
        this.feeTypes = [];
        this.filteredFeeTypes = [];
        this.paginatedFeeTypes = [];
        this.popup.error('Error', 'Failed to load fee types.');
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

    this.popup.loading(this.isEditMode ? 'Updating fee type...' : 'Adding fee type...');

    if (this.isEditMode) {
      this.feeTypeService.updateFeeType(payload).subscribe({
        next: () => {
          this.closeDialog();
          this.loadFeeTypes();
          this.popup.success('Updated!', 'Fee type updated successfully.');
        },
        error: () => {
          this.popup.error('Error', 'Failed to update fee type.');
        }
      });
    } else {
      this.feeTypeService.createFeeType(payload).subscribe({
        next: () => {
          this.closeDialog();
          this.loadFeeTypes();
          this.popup.success('Added!', 'Fee type added successfully.');
        },
        error: () => {
          this.popup.error('Error', 'Failed to add fee type.');
        }
      });
    }
  }

  confirmDelete(ft: FeeType): void {
    this.popup.confirm(
      'Delete Fee Category?',
      `Are you sure you want to permanently delete the fee category <strong>${ft.typeName}</strong>?`,
      'Yes, Delete',
      'Cancel'
    ).then(confirmed => {
      if (confirmed) {
        this.popup.loading('Deleting fee type...');
        this.feeTypeService.deleteFeeType(ft.feeTypeId).subscribe({
          next: () => {
            this.loadFeeTypes();
            this.popup.deleted('Fee category');
          },
          error: (err) => {
            console.error('Delete Error:', err);
            this.popup.deleteError('Fee category', 'Failed to delete fee type. ' + (err.error?.title || err.message || ''));
          }
        });
      }
    });
  }

  deleteFeeType(): void {
    // legacy - unused
  }



  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.form.reset();
  }
}


