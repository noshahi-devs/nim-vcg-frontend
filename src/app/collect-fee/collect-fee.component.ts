import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonServices } from '../services/common.service';
import { Student } from '../Models/student';
import { Standard } from '../Models/standard';
import { MonthlyPayment } from '../Models/monthly-payment';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-collect-fee',
  standalone: true,
  templateUrl: './collect-fee.component.html',
  styleUrls: ['./collect-fee.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, BreadcrumbComponent]
})
export class CollectFeeComponent implements OnInit {

  title = 'Collect Fee';

  standards: Standard[] = [];
  students: Student[] = [];
  filteredStudents: Student[] = [];

  selectedStandardId: any;
  studentId: any;
  selectedStudent: Student | null = null;

  totalFee = 0;
  paidAmount = 0;
  remainingAmount = 0;

  previousPayments: MonthlyPayment[] = [];

  paymentForm: FormGroup;

  constructor(private fb: FormBuilder, private commonService: CommonServices) {
    this.paymentForm = this.fb.group({
      amountPaid: ['', [Validators.required, Validators.min(1)]],
      paymentType: ['Cash', Validators.required],
      paymentDate: [new Date().toISOString().substring(0,10), Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadStandards();
    this.loadStudents();
  }

  loadStandards() {
    this.commonService.getAllStandards().subscribe(r => this.standards = r);
  }

  loadStudents() {
    this.commonService.getAllStudents().subscribe(r => {
      this.students = r;
      this.filteredStudents = r;
    });
  }

  filterStudents() {
    if (this.selectedStandardId) {
      this.filteredStudents = this.students.filter(s => s.standardId == this.selectedStandardId);
    } else {
      this.filteredStudents = this.students;
    }
    this.studentId = null;
    this.selectedStudent = null;
    this.totalFee = this.paidAmount = this.remainingAmount = 0;
    this.previousPayments = [];
  }

  loadFeeInfo() {
    if (!this.studentId) return;

    this.selectedStudent = this.students.find(s => s.studentId == this.studentId) || null;
    if (!this.selectedStudent) return;

    // Fetch existing payments
    this.commonService.getAllPaymentsByStudentId(this.studentId).subscribe(payments => {
      this.previousPayments = payments;
     this.totalFee = 5000; // replace this.selectedStudent.totalFee
    this.paidAmount = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    this.remainingAmount = this.totalFee - this.paidAmount;

    });
  }

  submitPayment() {
    if (!this.studentId || this.paymentForm.invalid) return;

    if (this.paymentForm.value.amountPaid > this.remainingAmount) {
      alert("Amount cannot exceed remaining balance!");
      return;
    }

    // Create a new payment object
    const newPayment: MonthlyPayment = {
      monthlyPaymentId: Math.floor(Math.random() * 10000),
      student: this.selectedStudent,
      totalAmount: this.totalFee,
      amountPaid: this.paymentForm.value.amountPaid,
      amountRemaining: this.remainingAmount - this.paymentForm.value.amountPaid,
      paymentDate: this.paymentForm.value.paymentDate,
      studentId: 0,
      totalFeeAmount: 0,
      waver: 0,
      previousDue: 0,
      fees: [],
      academicMonths: [],
      paymentMonths: [],
      paymentDetails: [],
      dueBalances: []
    };

    // Simulate saving (or you could call existing API to save)
    this.previousPayments.push(newPayment);
    this.paidAmount += this.paymentForm.value.amountPaid;
    this.remainingAmount -= this.paymentForm.value.amountPaid;

    alert("Payment collected successfully!");
    this.paymentForm.reset({ paymentDate: new Date().toISOString().substring(0,10), paymentType: 'Cash' });
  }

  printReceipt() {
    const printContent = document.getElementById('receipt')?.innerHTML;
    if (!printContent) return;
    const w = window.open('', '', 'height=600,width=800');
    if (w) {
      w.document.write('<html><head><title>Fee Receipt</title></head><body>');
      w.document.write(printContent);
      w.document.write('</body></html>');
      w.document.close();
      w.print();
    }
  }

  downloadReceipt() {
    if (!this.selectedStudent) return;

    const headers = ['Student Name', 'Enrollment #', 'Paid Amount', 'Payment Type', 'Payment Date', 'Remaining Amount'];
    const rows = [[
      this.selectedStudent.studentName,
      this.selectedStudent.enrollmentNo,
      this.paymentForm.value.amountPaid,
      this.paymentForm.value.paymentType,
      this.paymentForm.value.paymentDate,
      this.remainingAmount
    ]];

    let csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fee_receipt.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

}
