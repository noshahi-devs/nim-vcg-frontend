import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { FeeService } from '../services/fee.service';
import { FeeTypeService } from '../services/feetype.service';
import { StandardService } from '../services/standard.service';
import { Fee } from '../Models/fee';
import { FeeType } from '../Models/feetype';
import { Standard } from '../Models/standard';

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

  fees: Fee[] = [];
  filteredFees: Fee[] = [];
  paginatedFees: Fee[] = [];

  feeTypes: FeeType[] = [];
  standards: Standard[] = [];

  searchTerm = '';
  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;

  showFeeDialog = false;
  isEditMode = false;

  feeForm!: FormGroup;

  showDeleteDialog = false;
  feeToDelete!: Fee;

  Math = Math;

  constructor(
    private feeService: FeeService,
    private feeTypeService: FeeTypeService,
    private standardService: StandardService
  ) {}

  ngOnInit(): void {
    this.feeForm = new FormGroup({
      feeId: new FormControl(0),
      standardId: new FormControl('', Validators.required),
      feeTypeId: new FormControl('', Validators.required),
      amount: new FormControl('', Validators.required),
      dueDate: new FormControl('', Validators.required)
    });

    this.loadDropdowns();
    this.loadFees();
  }

  loadDropdowns() {
    this.feeTypeService.getFeeTypes().subscribe(res => this.feeTypes = res);
    this.standardService.getStandards().subscribe(res => this.standards = res);
  }

  loadFees() {
    this.feeService.getAllFees().subscribe(res => {
      this.fees = res;
      this.applyFilters();
    });
  }

  applyFilters() {
    const term = this.searchTerm.toLowerCase();

    this.filteredFees = this.fees.filter(f =>
      (!this.feeForm.value.standardId || f.standardId == this.feeForm.value.standardId) &&
      (!this.feeForm.value.feeTypeId || f.feeTypeId == this.feeForm.value.feeTypeId) &&
      (!this.feeForm.value.minBalance || f.amount >= this.feeForm.value.minBalance) &&
      (
        !term ||
        f.standard?.standardName?.toLowerCase().includes(term) ||
        f.feeType?.typeName?.toLowerCase().includes(term)
      )
    );

    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredFees.length / this.rowsPerPage);
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedFees = this.filteredFees.slice(start, start + this.rowsPerPage);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  resetFilters() {
    this.feeForm.reset();
    this.searchTerm = '';
    this.applyFilters();
  }

  /* ---------- FEE DIALOG ---------- */
  openAddFee() {
    this.isEditMode = false;
    this.feeForm.reset();
    this.feeForm.patchValue({ feeId: 0 });
    this.showFeeDialog = true;
  }

  openEditFee(fee: Fee) {
    this.isEditMode = true;
    this.feeForm.patchValue(fee);
    this.showFeeDialog = true;
  }

  saveFee() {
    if (this.feeForm.invalid) return;
    const feeData = this.feeForm.value as Fee;

    if (this.isEditMode) {
      this.feeService.updateFee(feeData).subscribe(() => {
        alert('Fee updated successfully');
        this.showFeeDialog = false;
        this.loadFees();
      });
    } else {
      this.feeService.createFee(feeData).subscribe(() => {
        alert('Fee created successfully');
        this.showFeeDialog = false;
        this.loadFees();
      });
    }
  }

  confirmDelete(fee: Fee) {
    this.feeToDelete = fee;
    this.showDeleteDialog = true;
  }

  deleteFee() {
    this.feeService.deleteFee(this.feeToDelete.feeId).subscribe(() => {
      alert('Fee deleted successfully');
      this.showDeleteDialog = false;
      this.loadFees();
    });
  }
}
