import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonServices } from '../../../services/common.service';
import { Student } from '../../../Models/student';
import { Standard } from '../../../Models/standard';
import { MonthlyPayment } from '../../../Models/monthly-payment';
import { OthersPayment } from '../../../Models/other-payment';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../../ui-elements/breadcrumb/breadcrumb.component';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent, RouterLink]

})
export class PaymentDetailComponent implements OnInit {

  title = 'Payment Details';
  standards: Standard[] = [];
  students: Student[] = [];
  filteredStudents: Student[] = [];

  studentId: any;
  selectedStandardId: any;

  payments: MonthlyPayment[] = [];
  otherPayments: OthersPayment[] = [];

  paginatedPayments: MonthlyPayment[] = [];
  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  toEntry = 0;

  searchTerm = '';

  showAddEditDialog = false;
  showViewDialog = false;
  showDeleteDialog = false;
  isEditMode = false;
  selectedPayment: MonthlyPayment | OthersPayment | null = null;
  paymentToDelete: MonthlyPayment | OthersPayment | null = null;

  form: FormGroup;
  filteredPayments: any;

  constructor(private commonService: CommonServices, private fb: FormBuilder) {
    this.form = this.fb.group({
      studentId: ['', Validators.required],
      totalAmount: ['', Validators.required],
      amountPaid: ['', Validators.required],
      dueBalance: [''],
      paymentDate: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.fetchStandards();
    this.fetchStudents();
  }

  // Fetch standards and students
  fetchStandards() {
    this.commonService.getAllStandards().subscribe(r => this.standards = r);
  }

  fetchStudents() {
    this.commonService.getAllStudents().subscribe(r => {
      this.students = r;
      this.filteredStudents = r;
    });
  }

  onStandardChange() {
    if (this.selectedStandardId) {
      this.filteredStudents = this.students.filter(s => s.standardId === parseInt(this.selectedStandardId));
    } else {
      this.filteredStudents = this.students;
    }
  }

  onSubmit() {
    if (!this.studentId) return;
    this.getPayments();
    this.getOtherPayments();
  }
  // Pagination
  updatePagination() {
    const start = (this.currentPage - 1) * this.rowsPerPage;
    const end = start + this.rowsPerPage;
    this.paginatedPayments = this.payments.slice(start, end);
    this.totalPages = Math.ceil(this.payments.length / this.rowsPerPage);
    this.toEntry = Math.min(end, this.payments.length);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  searchPayments() {
    if (!this.searchTerm) {
      this.paginatedPayments = this.payments.slice(0, this.rowsPerPage);
      return;
    }
    const term = this.searchTerm.toLowerCase();
    this.paginatedPayments = this.payments.filter(p =>
      p.student?.studentName.toLowerCase().includes(term) ||
      p.monthlyPaymentId?.toString().includes(term)
    ).slice(0, this.rowsPerPage);
  }

  // Modal Handling
  openAddDialog(isOtherPayment: boolean) {
    this.showAddEditDialog = true;
    this.isEditMode = false;
    this.form.reset();
    // Add additional flags if needed for monthly vs other payment
  }

  openEditDialog(payment: MonthlyPayment | OthersPayment) {
    this.showAddEditDialog = true;
    this.isEditMode = true;
    this.selectedPayment = payment;
    this.form.patchValue({
      studentId: payment.student?.studentId,
      totalAmount: payment.totalAmount,
      amountPaid: payment.amountPaid,
      dueBalance: payment.amountRemaining,
      paymentDate: payment.paymentDate
    });
  }

  openViewDialog(payment: MonthlyPayment | OthersPayment) {
    this.selectedPayment = payment;
    this.showViewDialog = true;
  }

  closeDialog() {
    this.showAddEditDialog = false;
    this.showViewDialog = false;
    this.selectedPayment = null;
  }

  confirmDelete(payment: MonthlyPayment | OthersPayment) {
    this.paymentToDelete = payment;
    this.showDeleteDialog = true;
  }

  deletePayment() {
    // Call service to delete
    if (!this.paymentToDelete) return;
    this.showDeleteDialog = false;
    // After deletion, refresh the list
    this.onSubmit();
  }

  savePayment() {
    if (this.form.invalid) return;
    const paymentData = this.form.value;
    if (this.isEditMode && this.selectedPayment) {
      // Call update service
    } else {
      // Call add service
    }
    this.closeDialog();
    this.onSubmit();
  }

  // Print and Download
  printPayments() {
    window.print();
  }

  downloadPayments() {
    // Simple CSV download
    const headers = ['Payment ID', 'Student Name', 'Enrollment #', 'Total Amount', 'Amount Paid', 'Amount Remaining', 'Payment Date'];
    const rows = this.paginatedPayments.map(p => [
      p.monthlyPaymentId,
      p.student?.studentName,
      p.student?.enrollmentNo,
      p.totalAmount,
      p.amountPaid,
      p.amountRemaining,
      p.paymentDate
    ]);

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "monthly_payments.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  getPayments() {
    this.commonService.getAllPaymentsByStudentId(this.studentId)
      .subscribe(r => {
        // Map student object
        this.payments = r.map(p => {
          const studentObj = this.students.find(s => s.studentId === p.studentId);
          return { ...p, student: studentObj };
        });
        this.updatePagination();
      });
  }

  getOtherPayments() {
    this.commonService.getAllOtherPaymentsByStudentId(this.studentId)
      .subscribe(r => {
        this.otherPayments = r.map(p => {
          const studentObj = this.students.find(s => s.studentId === p.studentId);
          return { ...p, student: studentObj };
        });
      });
  }

}
