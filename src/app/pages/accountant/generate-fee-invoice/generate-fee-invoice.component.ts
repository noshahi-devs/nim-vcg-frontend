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
import Swal from 'sweetalert2';

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
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load fee records.', confirmButtonColor: '#6366f1' })
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
          Swal.fire({ icon: 'success', title: 'Updated!', text: 'Fee updated successfully.', showConfirmButton: false, timer: 1800 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update fee.', confirmButtonColor: '#6366f1' })
      });
    } else {
      this.feeService.createFee(feeData).subscribe({
        next: () => {
          this.showFeeDialog = false;
          this.loadFees();
          Swal.fire({ icon: 'success', title: 'Created!', text: 'Fee created successfully.', showConfirmButton: false, timer: 1800 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to create fee.', confirmButtonColor: '#6366f1' })
      });
    }
  }

  /* ---------- DELETE ---------- */
  async confirmDelete(fee: Fee) {
    const result = await Swal.fire({
      title: 'Delete Fee Record?',
      html: `Are you sure you want to delete the fee for <strong>${fee.standard?.standardName}</strong>?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280'
    });

    if (result.isConfirmed) {
      this.feeService.deleteFee(fee.feeId).subscribe({
        next: () => {
          this.loadFees();
          Swal.fire({ icon: 'success', title: 'Deleted!', text: 'Fee record has been deleted.', showConfirmButton: false, timer: 1800 });
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to delete fee.', confirmButtonColor: '#6366f1' })
      });
    }
  }
}
