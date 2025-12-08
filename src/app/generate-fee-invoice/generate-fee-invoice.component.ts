import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { FeeService, FeeStructure, Student } from '../services/fee.service';

@Component({
  selector: 'app-generate-fee-invoice',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './generate-fee-invoice.component.html'
})
export class GenerateFeeInvoiceComponent implements OnInit {
  title = 'Generate Fee Invoice';

  classes = ['Five', 'Six'];
  sections = ['A', 'B', 'C'];

  selectedClass = '';
  selectedSection = '';
  searchQuery = '';

  students: Student[] = [];
  selectedStudents: Student[] = [];

  feeStructure?: FeeStructure;
  month = new Date().toISOString().substring(0, 7);
  extraCharges: { name: string; amount: number }[] = [];

  constructor(private feeSvc: FeeService, private router: Router) {}

  ngOnInit(): void {}

  searchStudents() {
    this.feeSvc.getStudentsFiltered(this.selectedClass, this.selectedSection, this.searchQuery)
      .subscribe({
        next: (r) => (this.students = r),
        error: () => Swal.fire('Error', 'Failed to fetch students', 'error')
      });
  }

  toggleStudentSelection(s: Student) {
    const idx = this.selectedStudents.findIndex(x => x.id === s.id);
    if (idx >= 0) this.selectedStudents.splice(idx, 1);
    else this.selectedStudents.push(s);
  }

  /** ✅ FIXED: helper method for template binding */
  isStudentSelected(s: Student): boolean {
    return this.selectedStudents.some(st => st.id === s.id);
  }

  loadFeeStructure() {
    if (!this.selectedClass) {
      this.feeStructure = undefined;
      return;
    }

    this.feeSvc.getFeeStructureByClass(this.selectedClass).subscribe({
      next: (f) => (this.feeStructure = f),
      error: () => Swal.fire('Error', 'Failed to load fee structure', 'error')
    });
  }

  addExtraCharge() {
    this.extraCharges.push({ name: 'Other', amount: 0 });
  }

  removeExtraCharge(i: number) {
    this.extraCharges.splice(i, 1);
  }

  computeTotalForStudent(student: Student) {
    if (!this.feeStructure) return 0;
    const base = this.feeStructure.baseFee;
    const fundSum = this.feeStructure.otherFunds?.reduce((s, x) => s + (x.amount || 0), 0) || 0;
    const extras = this.extraCharges.reduce((s, x) => s + Number(x.amount || 0), 0);
    return base + fundSum + extras;
  }

  generateInvoices(singleStudent?: Student) {
    const targets = singleStudent ? [singleStudent] : this.selectedStudents;
    if (!targets.length) {
      Swal.fire('Select Students', 'Select at least one student to generate invoice', 'warning');
      return;
    }
    if (!this.feeStructure) {
      Swal.fire('Fee Structure', 'Please select class and load fee structure', 'warning');
      return;
    }

    const created: any[] = [];
    targets.forEach((s) => {
      const total = this.computeTotalForStudent(s);
      this.feeSvc
        .createInvoice({
          studentId: s.id,
          studentName: s.name,
          className: s.className,
          section: s.section,
          month: this.month,
          totalFee: total,
          paidAmount: 0
        })
        .subscribe({
          next: (inv) => created.push(inv),
          error: () => Swal.fire('Error', `Failed to create invoice for ${s.name}`, 'error')
        });
    });

    Swal.fire({
      icon: 'success',
      title: 'Invoices Generated',
      text: `${targets.length} invoice(s) created successfully.`,
      timer: 2000,
      showConfirmButton: false
    }).then(() => this.router.navigate(['/collect-fee']));
  }
}
