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
  Math = Math; // Template access

  standards: Standard[] = [];
  students: Student[] = [];
  filteredStudents: Student[] = [];

  studentId: any = '';
  selectedStandardId: any = '';

  payments: MonthlyPayment[] = [];
  otherPayments: OthersPayment[] = [];

  // Unified pagination/search
  activeTab: 'monthly' | 'other' = 'monthly';
  filteredMonthly: MonthlyPayment[] = [];
  filteredOther: OthersPayment[] = [];
  paginatedData: any[] = [];

  rowsPerPage = 10;
  currentPage = 1;
  totalPages = 1;
  toEntry = 0;
  searchTerm = '';

  showAddEditDialog = false;
  showViewDialog = false;
  showDeleteDialog = false;
  isEditMode = false;
  selectedPayment: any = null;
  paymentToDelete: any = null;

  constructor(private commonService: CommonServices) { }

  ngOnInit(): void {
    this.fetchStandards();
    this.fetchStudents();
  }

  /* ---------- GETTERS (STATS) ---------- */
  get totalMonthlyCollected() {
    return this.payments.reduce((a, b) => a + (b.amountPaid || 0), 0);
  }
  get totalOtherCollected() {
    return this.otherPayments.reduce((a, b) => a + (b.amountPaid || 0), 0);
  }
  get totalPending() {
    const monthlyRemaining = this.payments.reduce((a, b) => a + (b.amountRemaining || 0), 0);
    const otherRemaining = this.otherPayments.reduce((a, b) => a + (b.amountRemaining || 0), 0);
    return monthlyRemaining + otherRemaining;
  }
  get totalTransactions() {
    return this.payments.length + this.otherPayments.length;
  }

  /* ---------- DATA FETCHING ---------- */
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
    this.studentId = ''; // Reset student selection
  }

  onSubmit() {
    if (!this.studentId) return;
    this.currentPage = 1;
    this.getPayments();
    this.getOtherPayments();
  }

  getPayments() {
    this.commonService.getAllPaymentsByStudentId(this.studentId).subscribe(r => {
      this.payments = r.map(p => ({
        ...p,
        student: this.students.find(s => s.studentId === p.studentId)
      }));
      this.applyFilter();
    });
  }

  getOtherPayments() {
    this.commonService.getAllOtherPaymentsByStudentId(this.studentId).subscribe(r => {
      this.otherPayments = r.map(p => ({
        ...p,
        student: this.students.find(s => s.studentId === p.studentId)
      }));
      this.applyFilter();
    });
  }

  /* ---------- FILTER & PAGINATION ---------- */
  setTab(tab: 'monthly' | 'other') {
    this.activeTab = tab;
    this.currentPage = 1;
    this.applyFilter();
  }

  searchPayments() {
    this.currentPage = 1;
    this.applyFilter();
  }

  applyFilter() {
    const term = this.searchTerm.toLowerCase();

    // Filter Monthly
    this.filteredMonthly = this.payments.filter(p =>
      !term ||
      p.student?.studentName?.toLowerCase().includes(term) ||
      p.monthlyPaymentId?.toString().includes(term)
    );

    // Filter Other
    this.filteredOther = this.otherPayments.filter(p =>
      !term ||
      p.student?.studentName?.toLowerCase().includes(term) ||
      p.othersPaymentId?.toString().includes(term)
    );

    this.updatePagination();
  }

  updatePagination() {
    const currentList = this.activeTab === 'monthly' ? this.filteredMonthly : this.filteredOther;
    this.totalPages = Math.max(1, Math.ceil(currentList.length / this.rowsPerPage));
    const start = (this.currentPage - 1) * this.rowsPerPage;
    this.paginatedData = currentList.slice(start, start + this.rowsPerPage);
    this.toEntry = Math.min(start + this.rowsPerPage, currentList.length);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePagination();
  }

  /* ---------- MODALS & ACTIONS ---------- */
  openViewDialog(payment: any) {
    this.selectedPayment = payment;
    this.showViewDialog = true;
  }

  closeDialog() {
    this.showViewDialog = false;
    this.selectedPayment = null;
  }

  printPayments() {
    window.print();
  }

  downloadPayments() {
    const headers = ['ID', 'Student Name', 'Enrollment #', 'Total', 'Paid', 'Remaining', 'Date'];
    const currentList = this.activeTab === 'monthly' ? this.filteredMonthly : this.filteredOther;

    const rows = currentList.map(p => [
      this.activeTab === 'monthly' ? p.monthlyPaymentId : (p as any).othersPaymentId,
      p.student?.studentName,
      p.student?.enrollmentNo,
      p.totalAmount,
      p.amountPaid,
      p.amountRemaining,
      new Date(p.paymentDate).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${this.activeTab}_payments.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
