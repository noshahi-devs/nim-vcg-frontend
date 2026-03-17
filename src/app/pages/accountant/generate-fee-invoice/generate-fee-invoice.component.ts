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
import Swal from '../../../swal';

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

  // ===== MODAL =====
  showFeeDialog = false;
  isEditMode = false;
  feeForm!: FormGroup;

  // Premium Modal State
  showFeedbackModal = false;
  feedbackType: 'success' | 'error' | 'warning' = 'success';
  feedbackTitle = '';
  feedbackMessage = '';
  isProcessing = false;

  // For Deletion Confirmation
  showDeleteModal = false;
  feeToDelete: Fee | null = null;

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
      next: res => { this.fees = res; this.applyFilters(); },
      error: () => this.showFeedback('error', 'Error', 'Failed to load fee records.')
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

  /* ---------- DASHBOARD STATS ---------- */
  get totalRecords() {
    return this.fees.length;
  }

  get totalAmount() {
    return this.fees.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }

  get uniqueStandardsCount() {
    return new Set(this.fees.map(f => f.standardId)).size;
  }

  /* ---------- ADD / EDIT ---------- */
  openAddFee() {
    this.isEditMode = false;
    this.feeForm.reset({ feeId: 0 });
    this.showFeeDialog = true;
  }

  openEditFee(fee: Fee) {
    this.isEditMode = true;
    const dueDate = fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : '';
    this.feeForm.patchValue({
      feeId: fee.feeId,
      standardId: fee.standardId,
      feeTypeId: fee.feeTypeId,
      paymentFrequency: fee.paymentFrequency,
      amount: fee.amount,
      dueDate: dueDate
    });
    this.showFeeDialog = true;
  }

  saveFee() {
    if (this.feeForm.invalid) return;
    const feeData = this.feeForm.value as Fee;

    this.isProcessing = true;

    if (this.isEditMode) {
      this.feeService.updateFee(feeData).subscribe({
        next: () => {
          this.isProcessing = false;
          this.showFeeDialog = false;
          this.loadFees();
          this.showFeedback('success', 'Updated!', 'Fee updated successfully.');
        },
        error: () => {
          this.isProcessing = false;
          this.showFeedback('error', 'Error', 'Failed to update fee.');
        }
      });
    } else {
      this.feeService.createFee(feeData).subscribe({
        next: () => {
          this.isProcessing = false;
          this.showFeeDialog = false;
          this.loadFees();
          this.showFeedback('success', 'Created!', 'Fee created successfully.');
        },
        error: () => {
          this.isProcessing = false;
          this.showFeedback('error', 'Error', 'Failed to create fee.');
        }
      });
    }
  }

  /* ---------- DELETE ---------- */
  confirmDelete(fee: Fee): void {
    this.feeToDelete = fee;
    this.showDeleteModal = true;
  }

  deleteFee(): void {
    if (!this.feeToDelete) return;
    const id = this.feeToDelete.feeId;

    this.isProcessing = true;
    this.feeService.deleteFee(id).subscribe({
      next: () => {
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.feeToDelete = null;
        this.loadFees();
        this.showFeedback('success', 'Deleted!', 'Fee record has been deleted.');
      },
      error: () => {
        this.isProcessing = false;
        this.showDeleteModal = false;
        this.feeToDelete = null;
        this.showFeedback('error', 'Error', 'Failed to delete fee.');
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
}


