import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { FeeService } from '../../../services/fee.service';
import { FeeTypeService } from '../../../services/feetype.service';
import { StandardService } from '../../../services/standard.service';
import { Fee } from '../../../Models/fee';
import { FeeType } from '../../../Models/feetype';
import { Standard } from '../../../Models/standard';

@Component({
  selector: 'app-generate-fee-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './generate-fee-invoice.component.html',
  styleUrls: ['./generate-fee-invoice.component.css']
})
export class GenerateFeeInvoiceComponent implements OnInit {

  title = 'Generate Fee Invoice';
  Math = Math;

  // ===== DATA =====
  fees: Fee[] = [];
  filteredFees: Fee[] = [];
  paginatedFees: Fee[] = [];

  feeTypes: FeeType[] = [];
  standards: Standard[] = [];

  // ===== FILTERS =====
  filterForm!: FormGroup;
  searchTerm = '';

  // ===== PAGINATION =====
  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;

  // ===== MODALS =====
  showFeeDialog = false;
  isEditMode = false;
  showDeleteDialog = false;

  // ===== FORMS =====
  feeForm!: FormGroup;
  feeToDelete!: Fee;

  // ===== TOAST =====
  toast: { show: boolean; type: 'success' | 'error'; message: string } = {
    show: false, type: 'success', message: ''
  };
  private toastTimer: any;

  constructor(
    private feeService: FeeService,
    private feeTypeService: FeeTypeService,
    private standardService: StandardService
  ) { }

  ngOnInit(): void {
    this.filterForm = new FormGroup({
      standardId: new FormControl(''),
      feeTypeId: new FormControl(''),
      minAmount: new FormControl('')
    });

    this.feeForm = new FormGroup({
      feeId: new FormControl(0),
      standardId: new FormControl('', Validators.required),
      feeTypeId: new FormControl('', Validators.required),
      paymentFrequency: new FormControl('', Validators.required),
      amount: new FormControl('', Validators.required),
      dueDate: new FormControl('', Validators.required)
    });

    this.loadDropdowns();
    this.loadFees();
  }

  /* ---------- LOADERS ---------- */
  loadDropdowns() {
    this.feeTypeService.getFeeTypes().subscribe(res => this.feeTypes = res);
    this.standardService.getStandards().subscribe(res => this.standards = res);
  }

  loadFees() {
    this.feeService.getAllFees().subscribe({
      next: res => {
        this.fees = res;
        this.applyFilters();
      },
      error: () => this.showToast('error', 'Failed to load fee records.')
    });
  }

  /* ---------- FILTERING ---------- */
  applyFilters() {
    const { standardId, feeTypeId, minAmount } = this.filterForm.value;
    const term = this.searchTerm.toLowerCase();

    this.filteredFees = this.fees.filter(f =>
      (!standardId || f.standardId == standardId) &&
      (!feeTypeId || f.feeTypeId == feeTypeId) &&
      (!minAmount || f.amount >= minAmount) &&
      (!term || f.standard?.standardName?.toLowerCase().includes(term) || f.feeType?.typeName?.toLowerCase().includes(term))
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.filterForm.reset();
    this.searchTerm = '';
    this.applyFilters();
  }

  /* ---------- PAGINATION ---------- */
  updatePagination() {
    this.totalPages = Math.max(1, Math.ceil(this.filteredFees.length / this.rowsPerPage));
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedFees = this.filteredFees.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ---------- ADD / EDIT ---------- */
  openAddFee() {
    this.isEditMode = false;
    this.feeForm.reset({ feeId: 0 });
    this.showFeeDialog = true;
  }

  openEditFee(fee: Fee) {
    this.isEditMode = true;
    this.feeForm.patchValue({
      feeId: fee.feeId,
      standardId: fee.standardId,
      feeTypeId: fee.feeTypeId,
      paymentFrequency: fee.paymentFrequency,
      amount: fee.amount,
      dueDate: fee.dueDate
    });
    this.showFeeDialog = true;
  }

  saveFee() {
    if (this.feeForm.invalid) return;
    const feeData = this.feeForm.value as Fee;

    if (this.isEditMode) {
      this.feeService.updateFee(feeData).subscribe({
        next: () => {
          this.showFeeDialog = false;
          this.loadFees();
          this.showToast('success', 'Fee updated successfully!');
        },
        error: () => this.showToast('error', 'Failed to update fee. Please try again.')
      });
    } else {
      this.feeService.createFee(feeData).subscribe({
        next: () => {
          this.showFeeDialog = false;
          this.loadFees();
          this.showToast('success', 'Fee created successfully!');
        },
        error: () => this.showToast('error', 'Failed to create fee. Please try again.')
      });
    }
  }

  /* ---------- DELETE ---------- */
  confirmDelete(fee: Fee) {
    this.feeToDelete = fee;
    this.showDeleteDialog = true;
  }

  deleteFee() {
    this.feeService.deleteFee(this.feeToDelete.feeId).subscribe({
      next: () => {
        this.showDeleteDialog = false;
        this.loadFees();
        this.showToast('success', 'Fee deleted successfully!');
      },
      error: () => {
        this.showDeleteDialog = false;
        this.showToast('error', 'Failed to delete fee. Please try again.');
      }
    });
  }

  /* ---------- TOAST ---------- */
  showToast(type: 'success' | 'error', message: string) {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast = { show: true, type, message };
    this.toastTimer = setTimeout(() => { this.toast.show = false; }, 3500);
  }
}
